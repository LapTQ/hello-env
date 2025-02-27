
IFS=$'\n'
TAG_MSG__ERROR="\033[31m[ERROR]\033[0m"
TAG_MSG__SUCCESS="\033[92m[SUCCESS]\033[0m"
TAG_MSG__INFO="\033[94m[INFO]\033[0m"
TAG_MSG__WARNING="\033[33m[WARNING]\033[0m"

print_msg() {
    local level=$1
    local msg=$2
    case $level in
        "INFO")
            level=$TAG_MSG__INFO
            ;;
        "WARNING")
            level=$TAG_MSG__WARNING
            ;;
        "SUCCESS")
            level=$TAG_MSG__SUCCESS
            ;;
        "ERROR")
            level=$TAG_MSG__ERROR
            ;;
        *)
            echo "Invalid logging level: $level"
            exit 1
            ;;
    esac
    echo -e "$level $msg"
}

# Enable immediate exit on error
set -e

# Function to handle errors
raise_error() {
    print_msg "ERROR" "Error occurred on line $1"
    exit 1
}

# Trap any error and call the raise_error function
trap 'raise_error $LINENO' ERR

