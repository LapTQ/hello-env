## Install

```bash
curl -fsSL https://apt.fury.io/wez/gpg.key | sudo gpg --yes --dearmor -o /etc/apt/keyrings/wezterm-fury.gpg
echo 'deb [signed-by=/etc/apt/keyrings/wezterm-fury.gpg] https://apt.fury.io/wez/ * *' | sudo tee /etc/apt/sources.list.d/wezterm.list
sudo apt update
sudo apt install wezterm
```

## Change color theme

Create a file named `.wezterm.lua` in your home directory with the following content:
```lua
local wezterm = require 'wezterm'

local config = {
    -- window_decorations = "RESIZE",
    window_decorations = "INTEGRATED_BUTTONS|RESIZE",
    integrated_title_buttons = {
    --    'Hide',
        'Maximize',
        'Close'
    },
    enable_scroll_bar = true;

    -- color_scheme = 'Clone Of Ubuntu (Gogh)',
    color_scheme = 'shades-of-purple',

    font = wezterm.font('JetBrains Mono', {weight = 'Regular'}),
    font_size = 10.0,
}

return config
```
