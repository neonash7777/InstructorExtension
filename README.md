
# Instructor VS Code Extension

Instructor is a VS Code extension designed to augment the OUTLINE view, enabling educators, code reviewers, and teams to annotate, label, and filter code sections for better navigation and instructional clarity.

## Vision & Features

- **Label & Annotate Outline Entries:**
	- Add custom labels (e.g., Hidden, Locked, Blocked, Governed, Sectioned) to code sections directly in the OUTLINE or a new INSTRUCTOR OUTLINE view.
	- Color-coded and icon-enhanced labels for accessibility:
		- Normal: IDE default (white/black)
		- Hidden: Gray (Eye-Closed/Ghost icon)
		- Locked: Yellow (Lock icon)
		- Blocked: Red (Blocked icon)
		- Governed: Blue (Badge/Eye icon)
		- Sectioned: Purple (Section/Group icon)

- **Contextual Menus & Actions:**
	- Shift-click or right-click OUTLINE headers/entries to open a menu for label selection, toggling breakpoints/logpoints, and jumping to code.
	- Filter and expand/collapse sections by label.

- **Breakpoint & Logpoint Integration:**
	- Display breakpoint/logpoint indicators in the OUTLINE or INSTRUCTOR OUTLINE, similar to the editor gutter.

- **Code Annotation Support:**
	- Recognize and insert label annotations in code comments (e.g., `<!-- #Hidden -->` for HTML, `//IN:#Hidden` for JS/TS).

- **Accessibility & UX:**
	- High-contrast color choices and ARIA attributes for screen readers.
	- Keyboard navigation and menu accessibility.

- **Open Source & GitHub Integration:**
	- Designed for open source collaboration and GitHub workflows.


## Usage

### Labeling & Annotation

- Right-click any Instructor Outline entry to assign a label (Hidden, Locked, Blocked, Governed, Sectioned, Flagged).

- Use annotation comments in your code to auto-label sections:
	- **HTML:** `<!-- #Hidden -->`, `<!-- IN:#Locked -->`
	- **JS/TS/C#/Java:** `// #Blocked`, `//IN:#Governed`
	- **CSS/Java/C#:** `/* #Sectioned */`
	- **Python:** `# #Hidden`

### Flags

- Right-click an entry and select "Generate Flag" to create a custom flag with a friendly name and color.
- Use "Bulk Toggle Flags" to change the state of all flags at once (e.g., Blocked, Hidden, Normal).
- Use "Filter Flags" to show only flagged sections.

### Filtering & Navigation

- Use the command palette to filter by label or show only flagged sections.
- Click or use the context menu to jump to code for any outline entry.

### Accessibility

- All icons and labels use high-contrast colors and ARIA labels for screen readers.
- Keyboard navigation and quick toggles are supported for all actions.

## Annotation Conventions

| Language      | Comment Style Example                |
|-------------- |-------------------------------------|
| HTML          | `<!-- #Hidden -->`                  |
| JS/TS/C#/Java | `// #Locked` or `//IN:#Blocked`     |
| CSS/Java/C#   | `/* #Governed */`                   |
| Python        | `# #Sectioned`                      |

Labels supported: Hidden, Locked, Blocked, Governed, Sectioned, Flagged

## Accessibility Details

- All features are designed for keyboard and screen reader accessibility.
- Custom SVG icons are color-contrast tested.

## Release & Contribution

See CONTRIBUTING.md for guidelines (to be created). Please file issues for bugs or feature requests.

## Requirements

- Node.js and npm
- VS Code 1.102.0 or later

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines (to be created).

## License

MIT (to be confirmed)
