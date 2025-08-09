- [ ] Verify that the copilot-instructions.md file in the .github directory is created.

- [ ] Clarify Project Requirements
- [ ] Scaffold the Project
- [ ] Customize the Project
- [ ] Install Required Extensions
- [ ] Compile the Project
- [ ] Create and Run Task
- [ ] Launch the Project
- [ ] Ensure Documentation is Complete

Work through each checklist item systematically.

Ideally extension adds labels to the OUTLINE of Visual Studio Code;

extension adding labels to the OUTLINE so we can filter and expand/collapse specific sections more easily.
I already want to be able to shift-click the outline section header and show a menu (currently it does nothing) and then I want to select which label to apply, we can color code these as well;
What's the most accessible and logical color assignment for these?
Normal - IDE Normal Font Color (White/Black)
`Hidden` - Gray (`Eye-Closed` or `Ghost` Icon)
`Locked` - Yellow (`Lock Icon`)
`Blocked` -Red (`Blocked` Icon - Circle with diagonal line)
`Governed` - Blue (`Badge` or `Eye` Icon, what do you think?)
`Sectioned` - Purple (`Grouped` or `Section` Icon usually associated with a label)


Ideally I want to augment the existing OUTLINE for a number of good reasons. It already naturally has the structure we need so no redundant pane taking up space with the mostly repeat information. Additionally the current OUTLINE is lacking in functionality and features making it ideal for expansion is such a meaningful way as this. Currently right click does nothing on the entries. There's no way to tag or mark these sections in the OUTLINE as even breakpoints and log-points don't appear but probably should (we could add a red dot or red diamond like the IDE does along the left side with the line numbers - what's the name for this region in the IDE?) Otherwise we can create a new editor that mirrors the OUTLINE called INSTRUCTOR OUTLINE and combine them into the same region and tab between them;

So maybe the extension does both add breakpoint counts and instruction annotations; Maybe we call the extension "Instructor"?
Does VS Code have all the endpoints we need to do attach for this?
We need to add a icons to the OUTLINE entries conditionally. We need to add a menu for the OUTLINE entries that allows us to toggle the Instructor tags as well as maybe toggle breakpoints and logpoints and jump to code. 

We may need to annotate within the code when we these tags. So HTML might have something like this in HTML:
`<!-- Instructor Note: #Hidden -->`
OR
`<!-- IN:#Hidden -->`
OR
`<!-- #Hidden -->`
(Open to convention here...)

Similarly with other languages, like in javascript we could do something like:
//IN:#Hidden
OR
//#hidden
