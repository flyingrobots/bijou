Output examples/modal/demo.gif
Set Shell zsh
Set FontFamily "Monaspace Radon NF"
Set FontSize 14
Set Width 840
Set Height 528
Set Theme "Catppuccin Mocha"
Set Padding 20

Type "npx tsx examples/modal/main.ts"
Enter
Sleep 3s

# Navigate
Type "jj"
Sleep 500ms

# Open help modal
Type "?"
Sleep 1500ms

# Close help
Escape
Sleep 500ms

# Open confirm dialog
Type "d"
Sleep 1s

# Confirm delete
Type "y"
Sleep 500ms

# Open another confirm
Type "d"
Sleep 1s

# Cancel
Type "n"
Sleep 1s

Type "q"
Sleep 500ms
