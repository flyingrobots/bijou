Output "examples/docs/landing.gif"
Set Shell zsh
Set FontFamily "Monaspace Radon NF"
Set FontSize 11
Set Width 1280
Set Height 720
Set Theme "Catppuccin Mocha"
Set Padding 8

Hide
Type "exec sh -c 'export TERM=xterm-256color COLORTERM=truecolor; C=$(tput cols); R=$(tput lines); env TERM=$TERM COLORTERM=$COLORTERM DOGFOOD_CAPTURE_COLUMNS=$C DOGFOOD_CAPTURE_ROWS=$R DOGFOOD_CAPTURE_SCENARIO=landing ./node_modules/.bin/tsx examples/docs/capture-main.ts; clear; sleep 0.2'"
Enter
Sleep 1200ms
Show
Sleep 12s
