-- nano ~/.wezterm.lua

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

    font = wezterm.font('Roboto Mono', {weight = 'Regular'}),
    font_size = 9.0,
}

return config
