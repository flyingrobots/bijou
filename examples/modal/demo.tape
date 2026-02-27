Output examples/modal/demo.gif
Set Shell zsh
Set FontFamily "Berkeley Mono"
Set FontSize 14
Set Width 70
Set Height 24
Set Theme "Catppuccin Mocha"
Set Padding 20

Type "npx tsx examples/modal/main.ts"
Enter
Sleep 1s

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
