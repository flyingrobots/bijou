Output examples/split-editors/demo.gif
Set Shell zsh
Set FontFamily "Monaspace Radon NF"
Set FontSize 14
Set Width 100
Set Height 28
Set Theme "Catppuccin Mocha"
Set Padding 20

Type "npx tsx examples/split-editors/main.ts"
Enter
Sleep 1s

# Scroll left pane
Type "jjjjj"
Sleep 500ms
Type "jjjjj"
Sleep 500ms

# Switch to right pane
Tab
Sleep 500ms

# Scroll right pane
Type "jjjjj"
Sleep 500ms

# Switch back
Tab
Sleep 500ms

# Page down
Type "d"
Sleep 1s

Type "q"
Sleep 500ms
