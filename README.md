
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

## Implementation Plan

1. **Research VS Code API capabilities for OUTLINE augmentation.**
2. **If direct augmentation is not possible, implement a new INSTRUCTOR OUTLINE view mirroring the default OUTLINE.**
3. **Add context menus, label logic, and annotation parsing.**
4. **Integrate with breakpoints/logpoints and provide jump-to-code actions.**
5. **Ensure accessibility and color contrast compliance.**
6. **Document conventions for code annotations in various languages.**
7. **Prepare for GitHub open source release.**

## Requirements

- Node.js and npm
- VS Code 1.102.0 or later

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines (to be created).

## License

MIT (to be confirmed)
