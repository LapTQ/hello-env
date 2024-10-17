## Install

```bash
curl -fsSL https://apt.fury.io/wez/gpg.key | sudo gpg --yes --dearmor -o /etc/apt/keyrings/wezterm-fury.gpg
echo 'deb [signed-by=/etc/apt/keyrings/wezterm-fury.gpg] https://apt.fury.io/wez/ * *' | sudo tee /etc/apt/sources.list.d/wezterm.list
sudo apt update
sudo apt install wezterm
```

## Change color theme

Create a file named `.wezterm.lua` in your home directory with the following content:
```bash
local wezterm = require 'wezterm'
local config = {}

config.color_scheme = 'Aci (Gogh)'

return config
```
