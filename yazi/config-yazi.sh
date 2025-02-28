# ================== parameters (for stand-alone usage) ==================
if [ -z "$TO__CONFIG__YAZI" ]; then
    TO__CONFIG__YAZI="True"
fi

if [ -z "$TO__INSTALL__CATIMG" ]; then
    TO__INSTALL__CATIMG="True"
fi
# ================================================

source scripts/error-handlers.sh

if [ "$TO__CONFIG__YAZI" != "True" ]; then
    print_msg WARNING "Skipping yazi configuration"
    return
fi

print_msg INFO "Configurating yazi"


PATHD__CONFIG_YAZI=$( realpath ~ )/.config/yazi
# get the directory of this script
PATHD__HERE=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )
mkdir -p $PATHD__CONFIG_YAZI

# ================== config theme ==================
{
    ya pack -a yazi-rs/flavors:catppuccin-mocha
} || {
    # do nothing
    echo ""
}

cp $PATHD__HERE/theme.toml $PATHD__CONFIG_YAZI


# ================== config view ==================
if [ "$TO__INSTALL__CATIMG" = "True" ]; then
    pip install catimg
fi

cp $PATHD__HERE/yazi.toml $PATHD__CONFIG_YAZI