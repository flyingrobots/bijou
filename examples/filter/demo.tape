Output examples/filter/demo.gif
Set Shell zsh
Set FontFamily "Monaspace Radon NF"
Set FontSize 14
Set Width 960
Set Height 540
Set Theme "Catppuccin Mocha"
Set Padding 20

Type "npx tsx examples/filter/main.ts"
Enter
Sleep 3s

# Normal mode: j/k navigate
Type "j"
Sleep 500ms
Type "j"
Sleep 500ms
Type "k"
Sleep 500ms

# Enter insert mode with / then type a filter
Type "/"
Sleep 500ms
Type "fun"
Sleep 1s

# Navigate filtered results
Down
Sleep 500ms
Down
Sleep 500ms

# Select
Enter
Sleep 2s
