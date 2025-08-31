// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
// Drag and drop controller for Instructor Outline
class InstructorOutlineDnDController implements vscode.TreeDragAndDropController<InstructorOutlineItem> {
	dispose(): void {}
	readonly dropMimeTypes = [
		'application/vnd.code.tree.outline', // Built-in OUTLINE view
		'text/uri-list', // URI drops (e.g. from editor)
	];
	readonly dragMimeTypes = ['application/vnd.code.tree.instructorOutline'];

	handleDrag?(source: readonly InstructorOutlineItem[], dataTransfer: vscode.DataTransfer, token: vscode.CancellationToken): void | Thenable<void> {
		// When dragging from our view (label rows), set a JSON payload of labels
		try {
			const labels = source.map(s => s.label as string).filter(Boolean);
			dataTransfer.set('application/vnd.code.tree.instructorOutline', new vscode.DataTransferItem(JSON.stringify(labels)));
		} catch (e) {
			// ignore
		}
	}
	constructor(private outlineProvider: InstructorOutlineProvider) {}

	async handleDrop(target: InstructorOutlineItem | undefined, dataTransfer: vscode.DataTransfer, token: vscode.CancellationToken): Promise<void> {
		// Try OUTLINE drop first
		const outlineData = dataTransfer.get('application/vnd.code.tree.outline');
		if (outlineData) {
			// The value is a JSON string array of symbol labels
			let droppedLabels: string[] = [];
			try {
				droppedLabels = JSON.parse(outlineData.value);
			} catch {}
			for (const label of droppedLabels) {
				// Add as a bundled section or entry
				this.outlineProvider.addBundledSection(label, target?.label as string | undefined);
			}
			return;
		}
		// Try drops originating from our own view (label rows or item drags)
		const localData = dataTransfer.get('application/vnd.code.tree.instructorOutline');
		if (localData) {
			let droppedLabels: string[] = [];
			try { droppedLabels = JSON.parse(localData.value); } catch {}
			for (const label of droppedLabels) {
				// If the dragged token is one of the known label names, treat as a label drag
				const known: InstructorLabel[] = ['Hidden','Locked','Blocked','Governed','Sectioned','Flagged'];
				if (known.includes(label as InstructorLabel) && target) {
					this.outlineProvider.applyLabelToTarget(label as InstructorLabel, target.label as string);
				}
			}
			return;
		}
		// Try URI drop (e.g. from editor)
		const uriList = dataTransfer.get('text/uri-list');
		if (uriList) {
			// Could parse and add as needed
			// For now, ignore
		}
	}
}
// Helper: detect if a position in an HTML document is inside a <script> ... </script> block
function isInsideHtmlScript(doc: vscode.TextDocument, pos: vscode.Position): boolean {
	try {
		if (doc.languageId !== 'html') { return false; }
		const text = doc.getText();
		const offset = doc.offsetAt(pos);
		const lastOpen = text.lastIndexOf('<script', offset);
		const lastClose = text.lastIndexOf('</script', offset);
		return lastOpen > lastClose && lastOpen !== -1;
	} catch {
		return false;
	}
}
type InstructorLabel = 'Normal' | 'Hidden' | 'Locked' | 'Blocked' | 'Governed' | 'Sectioned' | 'Flagged';

interface Flag {
	name: string;
	color: string;
	section: string;
	purpose?: InstructorLabel;
}
const LABEL_ICONS: Record<InstructorLabel, string> = {
	Normal: '',
	Hidden: 'resources/hidden.svg',
	Locked: 'resources/locked.svg',
	Blocked: 'resources/blocked.svg',
	Governed: 'resources/governed.svg',
	Sectioned: 'resources/sectioned.svg',
	Flagged: '' // Use default flag codicon for flagged
};
const LABEL_COLORS: Record<InstructorLabel, string> = {
	Normal: '',
	Hidden: '#888',
	Locked: '#FFD600',
	Blocked: '#E53935',
	Governed: '#1E88E5',
	Sectioned: '#8E24AA',
	Flagged: '#FF9800'
};

// Use user-preferred Unicode/emoji for each label type (avoid Private Use Area)
const labelIcons: Record<InstructorLabel, string> = {
	Normal: '', 
	Hidden: '🙈',
	Locked: '🔒',  
	Blocked: '🚫',   
	Governed: '📜',
	Sectioned: '📁',
	Flagged: '🚩',   
};
class InstructorOutlineItem extends vscode.TreeItem {
	contextValue = 'instructorOutlineItem';
	labelType: InstructorLabel;
	range?: vscode.Range;
	flag?: Flag;
	constructor(
		label: string,
		collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.None,
		labelType: InstructorLabel = 'Normal',
		range?: vscode.Range,
		flag?: Flag
	) {
		super(label, collapsibleState);
		this.labelType = labelType;
		this.flag = flag;
		// const labelIcons: Record<InstructorLabel, string> = {
		// 	Normal: '', 
		// 	Hidden: '⚿',   //  ▨,⨳,🞺,▤,〾,⿴,⊝,⿱⿲,〼༞⧈
		// 	Locked: 'ꫪ',   // ꫪ
		// 	Blocked: '⦸',  // ☒,⦻
		// 	Governed: 'Ⓖ', // Ⓖ
		// 	Sectioned: '⧆', // ⧆,⯒
		// 	Flagged: '⚑',   // ⚑
		// };
		let desc = '';
		if (flag) {
			desc = `${labelIcons.Flagged} Flagged: ${flag.name}`;
			this.iconPath = new vscode.ThemeIcon('flag');
		} else if (labelType !== 'Normal') {
			desc = `${labelIcons[labelType]} ${labelType}`;
			if (LABEL_ICONS[labelType]) {
				this.iconPath = {
					light: vscode.Uri.file(`${__dirname}/../${LABEL_ICONS[labelType]}`),
					dark: vscode.Uri.file(`${__dirname}/../${LABEL_ICONS[labelType]}`)
				};
			}
		}
		this.description = desc || undefined;
		this.range = range;
		this.accessibilityInformation = {
			label: flag ? `${label} - Flagged: ${flag.name}` : `${label}${labelType !== 'Normal' ? ' - ' + labelType : ''}`,
			role: 'treeitem'
		};
		this.command = {
			command: 'instructorOutline.revealCode',
			title: 'Reveal Code',
			arguments: [this]
		};
		this.tooltip = flag ? `${label} (Flagged: ${flag.name})` : (labelType !== 'Normal' ? `${label} (${labelType})` : label);
	}
}

// InstructorOutlineProvider provides data for the Instructor Outline TreeView
class InstructorOutlineProvider implements vscode.TreeDataProvider<InstructorOutlineItem> {
	getParent(element: InstructorOutlineItem): InstructorOutlineItem | null {
		// Find parent by searching outlineTree for a child match
		for (const [parentLabel, children] of this.outlineTree.entries()) {
			if (children.includes(element)) {
				// Find the parent item in rootItems or outlineTree
				const parent = this.rootItems.find(i => i.label === parentLabel) ||
					Array.from(this.outlineTree.values()).flat().find(i => i.label === parentLabel);
				return parent || null;
			}
		}
		return null;
	}
	private _view?: vscode.TreeView<InstructorOutlineItem>;
	/**
	 * Recursively count label types among all children of a given outline item.
	 */
	private countChildLabels(label: string, visited = new Set<string>()): Partial<Record<InstructorLabel, number>> {
		const counts: Partial<Record<InstructorLabel, number>> = {};
		if (visited.has(label)) { return counts; } // Prevent cycles
		visited.add(label);
		const children = this.outlineTree.get(label) || [];
		for (const child of children) {
			counts[child.labelType] = (counts[child.labelType] || 0) + 1;
			if (child.collapsibleState === vscode.TreeItemCollapsibleState.Collapsed || child.collapsibleState === vscode.TreeItemCollapsibleState.Expanded) {
				const subCounts = this.countChildLabels(child.label as string, visited);
				for (const [k, v] of Object.entries(subCounts)) {
					counts[k as InstructorLabel] = (counts[k as InstructorLabel] || 0) + v;
				}
			}
		}
		return counts;
	}
	// Bundled sections: parent label -> child labels
	private bundledSections: Map<string, string[]> = new Map();

	// Add a bundled section (dragged from OUTLINE)
	addBundledSection(label: string, parentLabel?: string) {
		if (parentLabel) {
			if (!this.bundledSections.has(parentLabel)) { this.bundledSections.set(parentLabel, []); }
			this.bundledSections.get(parentLabel)!.push(label);
		} else {
			// If no parent, treat as root
			if (!this.bundledSections.has('root')) { this.bundledSections.set('root', []); }
			this.bundledSections.get('root')!.push(label);
		}
		this.refresh();
	}
	private _onDidChangeTreeData: vscode.EventEmitter<InstructorOutlineItem | undefined | void> = new vscode.EventEmitter<InstructorOutlineItem | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<InstructorOutlineItem | undefined | void> = this._onDidChangeTreeData.event;

	// In-memory label state for annotation, keyed by name+start line
	private labelMap = new Map<string, InstructorLabel>();
	private rangeMap = new Map<string, vscode.Range>();
	private symbolKey(name: string, range?: vscode.Range): string {
		return range ? `${name}@@${range.start.line}` : name;
	}
	private filterLabels: Set<InstructorLabel> = new Set();

	// remember previous multi-label selection when toggling all filters on/off
	private prevFilterLabels: InstructorLabel[] = [];
	// Store last selected filter labels for UI persistence
	get activeFilterLabels(): InstructorLabel[] {
		return Array.from(this.filterLabels);
	}
	private flags: Flag[] = [];
	private outlineItems: InstructorOutlineItem[] = [];
	private outlineTree: Map<string, InstructorOutlineItem[]> = new Map();
	private rootItems: InstructorOutlineItem[] = [];
	// Pseudo entries for annotations that don't have a following symbol (commented-out sections)
	private commentedEntries: { key: string; displayLabel: string; range: vscode.Range; labelType: InstructorLabel; parentLabel?: string }[] = [];

	// Apply a label to a target section by name
	applyLabelToTarget(label: InstructorLabel, targetSection: string) {
		// Find the symbol key by matching rootItems or outlineTree entries
		const findRange = (name: string): vscode.Range | undefined => {
			const root = this.rootItems.find(i => i.label === name);
			if (root && root.range) { return root.range; }
			for (const children of this.outlineTree.values()) {
				const c = children.find(ch => ch.label === name && ch.range);
				if (c && c.range) { return c.range; }
			}
			return undefined;
		};
		const range = findRange(targetSection);
		if (!range) { return; }
		// set the label using the existing setLabel flow
		this.setLabel(targetSection, label);
	}

	// Return all outline items with a given labelType
	getAllItemsByLabel(label: InstructorLabel): InstructorOutlineItem[] {
		const results: InstructorOutlineItem[] = [];
		const visit = (item?: InstructorOutlineItem) => {
			if (!item) { return; }
			if (item.labelType === label) { results.push(item); }
			const key = (item.label as string) || '';
			const children = this.outlineTree.get(key) || [];
			for (const c of children) { visit(c); }
		};
		for (const root of this.rootItems) { visit(root); }
		return results;
	}

	// Count top-level root branches that contain at least one item with the given label
	countTopLevelBranchesWithLabel(label: InstructorLabel): number {
		let count = 0;
		for (const root of this.rootItems) {
			const visitHasLabel = (item?: InstructorOutlineItem): boolean => {
				if (!item) { return false; }
				if (item.labelType === label) { return true; }
				const key = (item.label as string) || '';
				const children = this.outlineTree.get(key) || [];
				for (const c of children) { if (visitHasLabel(c)) { return true; } }
				return false;
			};
			if (visitHasLabel(root)) { count++; }
		}
		return count;
	}

	// Return true if the item or any of its descendants match the active filters
	private matchesFilterRecursive(item: InstructorOutlineItem, filters: Set<InstructorLabel>): boolean {
		if (!item) { return false; }
		if (filters.has(item.labelType) || (filters.has('Flagged' as InstructorLabel) && !!item.flag)) { return true; }
		const labelKey = (item.label as string) || '';
		const children = this.outlineTree.get(labelKey) || [];
		for (const c of children) {
			if (this.matchesFilterRecursive(c, filters)) { return true; }
		}
		return false;
	}
	constructor() {
		vscode.workspace.onDidOpenTextDocument(() => this.rebuildOutline());
		vscode.workspace.onDidChangeTextDocument(() => this.rebuildOutline());
		vscode.window.onDidChangeActiveTextEditor(() => this.rebuildOutline());
		this.rebuildOutline();
	}
	getTreeItem(element: InstructorOutlineItem): vscode.TreeItem {
		return element;
	}
	async getChildren(element?: InstructorOutlineItem): Promise<InstructorOutlineItem[]> {
		// Filtering logic
		const filters = this.filterLabels;
	const annotationLines: Set<number> = (this as any)._annotationLines || new Set();
		// Add a top-level bulk action item
		if (!element) {
			// Create a collapsible 'Labels' group and store label rows as its children
			const labelNames: InstructorLabel[] = ['Hidden','Locked','Blocked','Governed','Sectioned','Flagged'];
			// Create the bulk action row which will now live under the Labels group
			const bulkActionItem = new InstructorOutlineItem(
				'Bulk Actions: Expand/Collapse by Label',
				vscode.TreeItemCollapsibleState.None,
				'Sectioned'
			);
			bulkActionItem.contextValue = 'instructorOutlineBulkAction';
			bulkActionItem.iconPath = {
				light: vscode.Uri.file(`${__dirname}/../resources/sectioned.svg`),
				dark: vscode.Uri.file(`${__dirname}/../resources/sectioned.svg`)
			};
			bulkActionItem.command = {
				command: 'instructorOutline.expandCollapseAllWithLabel',
				title: 'Expand/Collapse All With Label'
			};
			const labelRows: InstructorOutlineItem[] = labelNames.map(l => {
				// compute a live count of top-level branches for this label (avoid nested inflation)
				const count = this.countTopLevelBranchesWithLabel(l);
				const li = new InstructorOutlineItem(l, vscode.TreeItemCollapsibleState.None, l, undefined);
				li.contextValue = 'instructorLabelRow';
				li.description = (this.filterLabels.has(l) ? '☑ ' : '☐ ') + `${l} (${count})`;
				li.command = { command: 'instructorOutline.toggleLabelFilter', title: 'Toggle Filter', arguments: [l] };
				return li;
			});
			// Put the label rows under an explicit parent so they can expand/collapse
			const labelsParentLabel = 'Labels';
			// Use 'Normal' so the header doesn't append a label name; we'll set a compact emoji-count description instead
			const labelsParent = new InstructorOutlineItem(labelsParentLabel, vscode.TreeItemCollapsibleState.Collapsed, 'Normal');
			labelsParent.contextValue = 'instructorLabelsGroup';
			const counts = labelNames.map(l => ({ l, n: this.countTopLevelBranchesWithLabel(l) }));
			const parts = counts.filter(c => c.n > 0).map(c => `${labelIcons[c.l as InstructorLabel] || c.l}${c.n}`);
			labelsParent.description = `${this.filterLabels.size > 0 ? '☑ ' : '☐ '}${parts.join(', ')}`;
			// Clicking the Labels header toggles all filters on/off (preserves previous selection)
			labelsParent.command = { command: 'instructorOutline.toggleAllFilters', title: 'Toggle All Filters' };
			// Store children in the outline tree so getChildren(element) will return them (no bulk action row)
			this.outlineTree.set(labelsParentLabel, labelRows);
			let items = [labelsParent, ...this.rootItems.slice()];
			// Add bundled sections as root items
			const bundledRoot = this.bundledSections.get('root') || [];
			for (const label of bundledRoot) {
				const item = this.createItem(label, vscode.TreeItemCollapsibleState.None);
				if (item) { items.push(item); }
			}
			// Add flagged sections
			for (const flag of this.flags) {
				const item = this.createItem(flag.section, vscode.TreeItemCollapsibleState.None, 'Flagged', undefined, flag);
				if (item) { items.push(item); }
			}
			// Add commented annotation entries: attach under parent when available; orphaned
			// commented entries are interspersed among root items in document order.
			for (const e of this.commentedEntries) {
				const item = this.createItem(e.displayLabel, vscode.TreeItemCollapsibleState.None, e.labelType, e.range);
				if (!item) { continue; }
				if (e.parentLabel) {
					if (!this.outlineTree.has(e.parentLabel)) { this.outlineTree.set(e.parentLabel, []); }
					const parentChildren = this.outlineTree.get(e.parentLabel)!;
					if (!parentChildren.find(c => c.label === item.label && c.range && item.range && c.range.start.line === item.range.start.line)) {
						parentChildren.push(item);
					}
				} else {
					// Orphan: insert into root items in document order (after Bulk Actions at index 0)
					let inserted = false;
					for (let i = 1; i < items.length; i++) {
						const it = items[i] as InstructorOutlineItem | undefined;
						if (!it || !it.range) { continue; }
						if (it.range.start.line > e.range.start.line) {
							if (!items.find(x => x && (x as InstructorOutlineItem).label === item.label && (x as InstructorOutlineItem).range && (x as InstructorOutlineItem).range!.start.line === item.range!.start.line)) {
								items.splice(i, 0, item);
							}
							inserted = true;
							break;
						}
					}
					if (!inserted) {
						if (!items.find(x => x && (x as InstructorOutlineItem).label === item.label && (x as InstructorOutlineItem).range && (x as InstructorOutlineItem).range!.start.line === item.range!.start.line)) {
							items.push(item);
						}
					}
				}
		}
			if (filters.size > 0) {
				items = items.filter(i => {
					if (!i) { return false; }
					// Always keep the Labels group visible so user can change filters
					if ((i as InstructorOutlineItem).contextValue === 'instructorLabelsGroup') { return true; }
					// Preserve parent items if any descendant matches the filters
					if (this.matchesFilterRecursive(i as InstructorOutlineItem, filters)) { return true; }
					return false;
				});
			}
		return items.filter(Boolean) as InstructorOutlineItem[];
	}
	// If this is a bundled section, show its children
		const bundled = this.bundledSections.get(element.label as string) || [];
		if (bundled.length > 0) {
			return bundled.map(label => this.createItem(label, vscode.TreeItemCollapsibleState.None)).filter(Boolean) as InstructorOutlineItem[];
		}
		let children = this.outlineTree.get(element.label as string) || [];
		// If this is the Labels group, always show all label rows so filters can be toggled
		if (filters.size > 0 && element.contextValue !== 'instructorLabelsGroup') {
			children = children.filter(i => i && this.matchesFilterRecursive(i as InstructorOutlineItem, filters));
		}
		// Include items that may not have a document range (label rows, grouped pseudo-entries)
		return children.filter(Boolean) as InstructorOutlineItem[];
	}

	createItem(label: string, collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.None, labelTypeOverride?: InstructorLabel, range?: vscode.Range, flag?: Flag): InstructorOutlineItem | undefined {
		// Filter out annotation-only lines from outline
		const annotationLines: Set<number> = (this as any)._annotationLines || new Set();
		const itemRange = range || this.rangeMap.get(this.symbolKey(label, range));
		if (itemRange && annotationLines.has(itemRange.start.line) && !flag) {
			return undefined;
		}
		const labelType = labelTypeOverride || this.labelMap.get(this.symbolKey(label, range)) || 'Normal';
		const item = new InstructorOutlineItem(label, collapsibleState, labelType, itemRange, flag);
		// Add label summary for collapsed sections with children
		if (!flag && (collapsibleState === vscode.TreeItemCollapsibleState.Collapsed || collapsibleState === vscode.TreeItemCollapsibleState.Expanded)) {
			const counts = this.countChildLabels(label);
			const summary = Object.entries(counts)
				.filter(([k, v]) => k !== 'Normal' && v && v > 0)
				.map(([k, v]) => `${labelIcons[k as InstructorLabel] || k}${v}`)
				.join(' ');
			if (summary) {
				item.description = (item.description ? item.description + ' ' : '') + summary;
			}
		}
		return item;
	}

	addFlag(section: string, name: string, color: string, purpose?: InstructorLabel) {
		const newFlag: Flag = { section, name, color, purpose };
		const idx = this.flags.findIndex(f => f.section === section);
		if (idx !== -1) {
			// Replace existing flag for this section
			this.flags[idx] = newFlag;
		} else {
			this.flags.push(newFlag);
		}
		this.refresh();
	}

	toggleFlagState(flagName: string, newPurpose?: InstructorLabel) {
		for (const flag of this.flags) {
			if (flag.name === flagName) {
				flag.purpose = newPurpose || (flag.purpose === 'Blocked' ? 'Normal' : 'Blocked');
			}
		}
		this.refresh();
	}

	filterFlags() {
		this.filterLabels = new Set(['Flagged']);
		this.refresh();
	}

	async setLabel(label: string, labelType: InstructorLabel)
	{
		const editor = vscode.window.activeTextEditor;
		let foundKey: string | undefined;
		if (editor) {
			const doc = editor.document;
			const symbols: vscode.DocumentSymbol[] = await vscode.commands.executeCommand('vscode.executeDocumentSymbolProvider', doc.uri) || [];
			const allSymbols: vscode.DocumentSymbol[] = [];
			const flattenSymbols = (syms: vscode.DocumentSymbol[]) => {
				for (const s of syms) {
					allSymbols.push(s);
					if (s.children && s.children.length) { flattenSymbols(s.children); }
				}
			};
			flattenSymbols(symbols);
			// prefer symbol under cursor, else first matching name
			let symbol = allSymbols.find(s => s.name === label && editor.selection && s.range.contains(editor.selection.active));
			if (!symbol) { symbol = allSymbols.find(s => s.name === label); }
			if (symbol) {
				foundKey = this.symbolKey(label, symbol.range);
				const annotation = this.annotationForLabel(labelType);
				const insertLine = symbol.range.start.line;
				// detect any existing annotation line within lookback window
				const annotationLineRegex = /^\s*(?:<!--\s*(?:IN:)?#\w+\s*-->|\/\/\s*(?:IN:)?#\w+|\/\*\s*(?:IN:)?#\w+\s*\*\/|#\s*(?:IN:)?#\w+)\s*$/i;
				const maxLookback = 8;
				let existingLine = -1;
				for (let i = insertLine - 1; i >= Math.max(0, insertLine - maxLookback); --i) {
					const text = doc.lineAt(i).text;
					if (annotationLineRegex.test(text)) { existingLine = i; break; }
					if (text.trim().length > 0) { break; } // stop if non-empty non-annotation encountered
				}

				if (existingLine >= 0) {
					// If toggling to Normal: remove any existing annotation line
					if (!annotation) {
						await editor.edit(editBuilder => {
							const start = new vscode.Position(existingLine, 0);
							const nextLinePos = (existingLine + 1 < doc.lineCount) ? new vscode.Position(existingLine + 1, 0) : new vscode.Position(existingLine, doc.lineAt(existingLine).text.length);
							editBuilder.delete(new vscode.Range(start, nextLinePos));
						});
						this.labelMap.set(foundKey, 'Normal');
					} else {
						// Replace the existing annotation line with the new annotation (preserve indent)
						const indentMatch = doc.lineAt(existingLine).text.match(/^\s*/);
						const indent = indentMatch ? indentMatch[0] : '';
						await editor.edit(editBuilder => {
							const start = new vscode.Position(existingLine, 0);
							const end = new vscode.Position(existingLine, doc.lineAt(existingLine).text.length);
							editBuilder.replace(new vscode.Range(start, end), indent + annotation);
						});
						this.labelMap.set(foundKey, labelType);
					}
				} else {
					// No existing annotation: insert (unless labelType is Normal)
					if (annotation) {
						const nextLineText = doc.lineAt(insertLine).text;
						const indentMatch = nextLineText.match(/^\s*/);
						const indent = indentMatch ? indentMatch[0] : '';
						await editor.edit(editBuilder => {
							editBuilder.insert(new vscode.Position(insertLine, 0), indent + annotation + '\n');
						});
						this.labelMap.set(foundKey, labelType);
					} else {
						// toggling to Normal but no annotation exists: ensure map cleared
						this.labelMap.set(foundKey, 'Normal');
					}
				}
			}
		}
		// fallback when symbol not found
		const key = foundKey || label;
		if (!foundKey) {
			if (this.labelMap.get(key) === labelType) { this.labelMap.set(key, 'Normal'); }
			else { this.labelMap.set(key, labelType); }
		}
		this.refresh();
	}

	annotationForLabel(labelType: InstructorLabel): string | undefined {
		switch (labelType) {
			case 'Hidden': return '<!-- #Hidden -->';
			case 'Locked': return '<!-- #Locked -->';
			case 'Blocked': return '<!-- #Blocked -->';
			case 'Governed': return '<!-- #Governed -->';
			case 'Sectioned': return '<!-- #Sectioned -->';
			default: return undefined;
		}
	}

	setFilterLabels(labels: InstructorLabel[] = []) {
		this.filterLabels = new Set(labels);
		this.refresh();
		// Update view title if available
		if (this._view) {
			if (this.filterLabels.size > 0) {
				this._view.title = `Instructor Outline (Filtered)`;
			} else {
				this._view.title = `Instructor Outline`;
			}
		}
	}
	// Allow the view to be set for title updates
	setView(view: vscode.TreeView<InstructorOutlineItem>) {
		this._view = view;
	}
	clearFilter() {
		this.filterLabels.clear();
		this.refresh();
	}

	// Toggle all filters on/off. When turning on, restore previous selection if available
	toggleAllFilters() {
		if (this.filterLabels.size > 0) {
			this.prevFilterLabels = Array.from(this.filterLabels);
			this.filterLabels.clear();
			this.refresh();
			return;
		}
		if (this.prevFilterLabels && this.prevFilterLabels.length > 0) {
			this.filterLabels = new Set(this.prevFilterLabels);
		} else {
			this.filterLabels = new Set(['Hidden','Locked','Blocked','Governed','Sectioned','Flagged']);
		}
		this.refresh();
	}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}
	// Parse annotations in the active text editor for demo
	async rebuildOutline() {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			this.rootItems = [];
			this.outlineTree.clear();
			this.refresh();
			return;
		}
		const doc = editor.document;
		// Get document symbols
		const symbols: vscode.DocumentSymbol[] = await vscode.commands.executeCommand('vscode.executeDocumentSymbolProvider', doc.uri) || [];
		this.labelMap.clear();
		this.rangeMap.clear();
		this.outlineTree.clear();
		this.rootItems = [];
		// Reset pseudo-commented entries so repeated rebuilds don't duplicate them
		this.commentedEntries = [];
		// Parse annotations for labels (await for async)
		await this.parseAnnotations(editor, symbols);
		// Recursively build outline tree
		const buildTree = (symbols: vscode.DocumentSymbol[], parent?: string): InstructorOutlineItem[] => {
			return symbols.map(sym => {
				const label = sym.name;
				const collapsible = sym.children && sym.children.length > 0 ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None;
				const item = this.createItem(label, collapsible, undefined, sym.range);
				if (!item) { return undefined; }
				if (parent) {
					if (!this.outlineTree.has(parent)) { this.outlineTree.set(parent, []); }
					this.outlineTree.get(parent)!.push(item);
				} else {
					this.rootItems.push(item);
				}
				if (sym.children && sym.children.length > 0) { buildTree(sym.children, label); }
				return item;
			}).filter(Boolean) as InstructorOutlineItem[];
		};
		buildTree(symbols);
		this.refresh();
	}

	/**
	 * Parse instructor annotation comments and map them to the closest enclosing symbol.
	 * This ensures each annotation is attached to the correct outline element.
	 */
	async parseAnnotations(editor: vscode.TextEditor, symbols: vscode.DocumentSymbol[]) {
		const text = editor.document.getText();
		// Regex for annotation comments in HTML, JS/TS, CSS, C#, and more
		const annotationRegex = /<!--\s*(?:IN:)?#(\w+)\s*-->|\/\/\s*(?:IN:)?#(\w+)|\/\*\s*(?:IN:)?#(\w+)\s*\*\/|#\s*(?:IN:)?#(\w+)/gi;
		// Flatten all symbols
		const allSymbols: vscode.DocumentSymbol[] = [];
		const flattenSymbols = (symbols: vscode.DocumentSymbol[]) => {
			for (const sym of symbols) {
				allSymbols.push(sym);
				if (sym.children && sym.children.length > 0) { flattenSymbols(sym.children); }
			}
		};
		flattenSymbols(symbols);
		let match;
		while ((match = annotationRegex.exec(text))) {
			const label = match[1] || match[2] || match[3] || match[4];
			if (label) {
				const labelType = this.toInstructorLabel(label);
				if (labelType) {
					const pos = editor.document.positionAt(match.index);
					const annotationLine = pos.line;
					// Find the symbol whose start line is >= annotation line and is the closest
					let bestSymbol: vscode.DocumentSymbol | undefined;
					let minDelta = Number.POSITIVE_INFINITY;
					for (const sym of allSymbols) {
						const delta = sym.range.start.line - annotationLine;
						if (delta >= 0 && delta < minDelta) {
							bestSymbol = sym;
							minDelta = delta;
						}
					}
					if (bestSymbol) {
						const key = this.symbolKey(bestSymbol.name, bestSymbol.range);
						this.labelMap.set(key, labelType);
						this.rangeMap.set(key, new vscode.Range(pos, pos));
					} else {
						// No following symbol: this is likely a commented-out section. Create a pseudo entry so it appears in the outline.
						const pseudoKey = `__commented__${annotationLine}@@${label}`;
						this.labelMap.set(pseudoKey, labelType);
						this.rangeMap.set(pseudoKey, new vscode.Range(pos, pos));
						// Determine parent by finding the closest enclosing symbol (whose range contains the annotation line) or the nearest preceding symbol
						let parentLabel: string | undefined;
						for (const sym of allSymbols) {
							if (sym.range.start.line <= annotationLine && sym.range.end.line >= annotationLine) {
								parentLabel = sym.name;
								break;
							}
						}
						if (!parentLabel) {
							// fallback to nearest preceding symbol
							let bestPre: vscode.DocumentSymbol | undefined;
							let bestPreDelta = Number.NEGATIVE_INFINITY;
							for (const sym of allSymbols) {
								const delta = sym.range.start.line - annotationLine;
								if (delta <= 0 && delta > bestPreDelta) { bestPre = sym; bestPreDelta = delta; }
							}
							if (bestPre) { parentLabel = bestPre.name; }
						}
						this.commentedEntries.push({ key: pseudoKey, displayLabel: `Commented: ${label}`, range: new vscode.Range(pos, pos), labelType, parentLabel });
					}
				}
			}
		}
	}
	toInstructorLabel(label: string): InstructorLabel | undefined {
		const normalized = label.toLowerCase();
		switch (normalized) {
			case 'hidden': return 'Hidden';
			case 'locked': return 'Locked';
			case 'blocked': return 'Blocked';
			case 'governed': return 'Governed';
			case 'sectioned': return 'Sectioned';
			case 'flagged': return 'Flagged';
			default: return undefined;
		}
	}

	// For demo: bulk toggle all flags to a new state
	bulkToggleFlags(newPurpose: InstructorLabel) {
		for (const flag of this.flags) {
			flag.purpose = newPurpose;
		}
		this.refresh();
	}
}
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// Expand/Collapse All With Label command (combined)
	context.subscriptions.push(
		vscode.commands.registerCommand('instructorOutline.expandCollapseAllWithLabel', async () => {
			const action = await vscode.window.showQuickPick([
				{ label: 'Expand', value: true },
				{ label: 'Collapse', value: false }
			], { placeHolder: 'Expand or collapse all sections with label...' });
			if (!action) { return; }
			const label = await vscode.window.showQuickPick([
				'Hidden', 'Locked', 'Blocked', 'Governed', 'Sectioned', 'Flagged'
			], { placeHolder: `${action.label} all sections with label...` });
			if (!label) { return; }
			const recurse = async (item: InstructorOutlineItem) => {
				if (item.labelType === label && item.range) {
					// Apply fold/unfold in the active editor for the symbol's range
					const editor = vscode.window.activeTextEditor;
					if (editor) {
						editor.selection = new vscode.Selection(item.range.start, item.range.start);
						await vscode.commands.executeCommand(action.value ? 'editor.unfold' : 'editor.fold');
					}
				}
				const children = await instructorOutlineProvider.getChildren(item);
				for (const child of children) {
					await recurse(child);
				}
			};
			const roots = await instructorOutlineProvider.getChildren();
			for (const root of roots) {
				await recurse(root);
			}
		})
	);
	// Expand All With Label command
	context.subscriptions.push(
		vscode.commands.registerCommand('instructorOutline.expandAllWithLabel', async () => {
			const label = await vscode.window.showQuickPick([
				'Hidden', 'Locked', 'Blocked', 'Governed', 'Sectioned', 'Flagged'
			], { placeHolder: 'Expand all sections with label...' });
			if (!label) { return; }
			const expandRecursive = async (item: InstructorOutlineItem) => {
				if (item.labelType === label && item.range) {
					const editor = vscode.window.activeTextEditor;
					if (editor) {
						editor.selection = new vscode.Selection(item.range.start, item.range.start);
						await vscode.commands.executeCommand('editor.unfold');
					}
				}
				const children = await instructorOutlineProvider.getChildren(item);
				for (const child of children) {
					await expandRecursive(child);
				}
			};
			const roots = await instructorOutlineProvider.getChildren();
			for (const root of roots) {
				await expandRecursive(root);
			}
		})
	);
	// Collapse All With Label command
	context.subscriptions.push(
		vscode.commands.registerCommand('instructorOutline.collapseAllWithLabel', async () => {
			const label = await vscode.window.showQuickPick([
				'Hidden', 'Locked', 'Blocked', 'Governed', 'Sectioned', 'Flagged'
			], { placeHolder: 'Collapse all sections with label...' });
			if (!label) { return; }
			const collapseRecursive = async (item: InstructorOutlineItem) => {
				if (item.labelType === label && item.range) {
					const editor = vscode.window.activeTextEditor;
					if (editor) {
						editor.selection = new vscode.Selection(item.range.start, item.range.start);
						await vscode.commands.executeCommand('editor.fold');
					}
				}
				const children = await instructorOutlineProvider.getChildren(item);
				for (const child of children) {
					await collapseRecursive(child);
				}
			};
			const roots = await instructorOutlineProvider.getChildren();
			for (const root of roots) {
				await collapseRecursive(root);
			}
		})
	);
	// Comment Section command
	context.subscriptions.push(
		vscode.commands.registerCommand('instructorOutline.commentSection', async (item: InstructorOutlineItem) => {
			if (!(item && typeof item.label === 'string')) { return; }
			const editor = vscode.window.activeTextEditor;
			if (!editor) { return; }
			const range = item.range || new vscode.Range(editor.selection.start, editor.selection.end);
			if (!range) { return; }
			// If document is HTML and we're inside <script> tags, prefer JS style comments
			const useJsComments = isInsideHtmlScript(editor.document, range.start);
			// Select the target region and toggle line comment (preferred) or block if needed
			editor.selection = new vscode.Selection(range.start, range.end);
			if (useJsComments) {
				// Use toggle line comment which will use JS style inside script
				await vscode.commands.executeCommand('editor.action.commentLine');
			} else {
				// Use built-in toggle comment which uses language configuration
				await vscode.commands.executeCommand('editor.action.blockComment');
			}
		})
	);
	// Uncomment Section command
	context.subscriptions.push(
		   vscode.commands.registerCommand('instructorOutline.uncommentSection', async (item: InstructorOutlineItem) => {
				   if (!(item && typeof item.label === 'string')) { return; }
				   const editor = vscode.window.activeTextEditor;
				   if (!editor) { return; }
				   const range = item.range || new vscode.Range(editor.selection.start, editor.selection.end);
				   if (!range) { return; }
				   // Decide whether to use JS comments inside <script>
				   const useJsComments = isInsideHtmlScript(editor.document, range.start);
				   editor.selection = new vscode.Selection(range.start, range.end);
				   if (useJsComments) {
					   await vscode.commands.executeCommand('editor.action.commentLine');
				   } else {
					   await vscode.commands.executeCommand('editor.action.blockComment');
				   }
		   })
	);
	// Expand Section command (fold/unfold in editor for the symbol range)
	context.subscriptions.push(
		vscode.commands.registerCommand('instructorOutline.expandSection', async (item: InstructorOutlineItem) => {
			if (!item || !item.range) { return; }
			const editor = vscode.window.activeTextEditor;
			if (!editor) { return; }
			editor.selection = new vscode.Selection(item.range.start, item.range.start);
			await vscode.commands.executeCommand('editor.unfold');
		})
	);
	// Collapse Section command (fold in editor for the symbol range)
	context.subscriptions.push(
		vscode.commands.registerCommand('instructorOutline.collapseSection', async (item: InstructorOutlineItem) => {
			if (!item || !item.range) { return; }
			const editor = vscode.window.activeTextEditor;
			if (!editor) { return; }
			editor.selection = new vscode.Selection(item.range.start, item.range.start);
			await vscode.commands.executeCommand('editor.fold');
		})
	);
	// Manual sync button for robust outline mirroring
	context.subscriptions.push(
		vscode.commands.registerCommand('instructorOutline.syncOutline', () => {
			instructorOutlineProvider.rebuildOutline();
		})
	);
	// Refresh button functionality for the Instructor Outline
	context.subscriptions.push(
		vscode.commands.registerCommand('instructorOutline.refresh', () => {
			instructorOutlineProvider.clearFilter();
			instructorOutlineProvider.refresh();
		})
	);
	// Collapse All and Expand All functionality for the Instructor Outline
	context.subscriptions.push(
		vscode.commands.registerCommand('instructorOutline.collapseAll', () => {
			// Workaround: refresh the view, which collapses all nodes by default
			instructorOutlineProvider.refresh();
		})
	);
	context.subscriptions.push(
		vscode.commands.registerCommand('instructorOutline.expandAll', async () => {
			// Recursively expand all root and child items
			const expandRecursive = async (item: InstructorOutlineItem) => {
				await instructorOutlineView.reveal(item, { expand: true });
				const children = await instructorOutlineProvider.getChildren(item);
				for (const child of children) {
					await expandRecursive(child);
				}
			};
			const roots = await instructorOutlineProvider.getChildren();
			for (const root of roots) {
				await expandRecursive(root);
			}
		})
	);
	console.log('Congratulations, your extension "InstructorExtension" is now active!');

       const instructorOutlineProvider = new InstructorOutlineProvider();
       const dndController = new InstructorOutlineDnDController(instructorOutlineProvider);
       const instructorOutlineView = vscode.window.createTreeView('instructorOutline', {
	       treeDataProvider: instructorOutlineProvider,
	       showCollapseAll: true,
	       dragAndDropController: dndController
       });
       instructorOutlineProvider.setView(instructorOutlineView);
       context.subscriptions.push(instructorOutlineView);
       context.subscriptions.push(dndController);
       // Ensure initial sync happens only when an active text editor is available
       function triggerInitialSync() {
	       if (vscode.window.activeTextEditor) {
		       instructorOutlineProvider.rebuildOutline();
		       return true;
	       }
	       return false;
       }
       if (!triggerInitialSync()) {
	       const disposable = vscode.window.onDidChangeActiveTextEditor(() => {
		       if (triggerInitialSync()) {
			       disposable.dispose();
		       }
	       });
	       context.subscriptions.push(disposable);
       }


			// Register context menu commands for labelling, quick toggle, and flagging
	// Generate Flag command
	context.subscriptions.push(
		vscode.commands.registerCommand('instructorOutline.generateFlag', async (item: InstructorOutlineItem) => {
			if (item && typeof item.label === 'string') {
				const name = await vscode.window.showInputBox({ prompt: 'Flag name', value: `${item.label} Flag` });
				if (!name) {return;}
				// Assign color based on section or random
				const color = LABEL_COLORS.Flagged;
				instructorOutlineProvider.addFlag(item.label, name, color);
			}
		})
	);

	// Bulk toggle all flags
	context.subscriptions.push(
		vscode.commands.registerCommand('instructorOutline.bulkToggleFlags', async () => {
			const pick = await vscode.window.showQuickPick([
				'Blocked', 'Hidden', 'Normal'
			], { placeHolder: 'Set all flags to...' });
			if (pick) {instructorOutlineProvider.bulkToggleFlags(pick as InstructorLabel);}
		})
	);

	// Filter only flags
	context.subscriptions.push(
		vscode.commands.registerCommand('instructorOutline.filterFlags', () => {
			instructorOutlineProvider.filterFlags();
		})
	);
	// Toggle a label row's filter
	context.subscriptions.push(
		vscode.commands.registerCommand('instructorOutline.toggleLabelFilter', (label: InstructorLabel) => {
			if (!label) { return; }
			// Toggle single label in the provider's filter set
			const current = new Set(instructorOutlineProvider.activeFilterLabels);
			if (current.has(label)) { current.delete(label); }
			else { current.add(label); }
			instructorOutlineProvider.setFilterLabels(Array.from(current));
		})
	);

	// Toggle all filters via Labels header
	context.subscriptions.push(
		vscode.commands.registerCommand('instructorOutline.toggleAllFilters', () => {
			instructorOutlineProvider.toggleAllFilters();
		})
	);
		const labelCommands: [InstructorLabel, string][] = [
			['Normal', 'instructorOutline.labelNormal'],
			['Hidden', 'instructorOutline.labelHidden'],
			['Locked', 'instructorOutline.labelLocked'],
			['Blocked', 'instructorOutline.labelBlocked'],
			['Governed', 'instructorOutline.labelGoverned'],
			['Sectioned', 'instructorOutline.labelSectioned']
		];
		for (const [labelType, commandId] of labelCommands) {
			context.subscriptions.push(
				vscode.commands.registerCommand(commandId, async (item: InstructorOutlineItem) => {
					if (item && typeof item.label === 'string') {
						await instructorOutlineProvider.setLabel(item.label, labelType);
					}
				})
			);
		}

		// Filtering commands
		context.subscriptions.push(
			vscode.commands.registerCommand('instructorOutline.filterLabel', async () => {
				const allLabels: InstructorLabel[] = ['Hidden', 'Locked', 'Blocked', 'Governed', 'Sectioned', 'Flagged'];
				const current = new Set(instructorOutlineProvider.activeFilterLabels);
				const picks = await vscode.window.showQuickPick(
					allLabels.map(label => ({ label, picked: current.has(label) })),
					{
						canPickMany: true,
						placeHolder: 'Select one or more labels to filter the outline...'
					}
				);
				if (!picks || picks.length === 0) {
					instructorOutlineProvider.setFilterLabels([]);
				} else {
					instructorOutlineProvider.setFilterLabels(picks.map(p => p.label as InstructorLabel));
				}
			})
		);
		// Clear filter command
		context.subscriptions.push(
			vscode.commands.registerCommand('instructorOutline.clearFilter', () => {
				instructorOutlineProvider.clearFilter();
			})
		);

		// Keyboard shortcut for quick toggle (example: Ctrl+L on focused item)
		context.subscriptions.push(
			vscode.commands.registerCommand('instructorOutline.quickToggle', (item: InstructorOutlineItem) => {
				if (item && typeof item.label === 'string') {
					// Toggle Hidden for demo
					instructorOutlineProvider.setLabel(item.label, 'Hidden');
				}
			})
		);

		// Jump to code
		context.subscriptions.push(
			vscode.commands.registerCommand('instructorOutline.revealCode', (item: InstructorOutlineItem) => {
				if (item && item.range) {
					const editor = vscode.window.activeTextEditor;
					if (editor) {
						editor.revealRange(item.range, vscode.TextEditorRevealType.InCenter);
						editor.selection = new vscode.Selection(item.range.start, item.range.end);
					}
				}
			})
		);

		// Hello World command remains
		const disposable = vscode.commands.registerCommand('InstructorExtension.helloWorld', () => {
			vscode.window.showInformationMessage('Hello World from Instructor!');
		});
		context.subscriptions.push(disposable);
}
// This method is called when your extension is deactivated
export function deactivate() {}
