#!/usr/bin/env bash

GREEN='\033[0;32m'
BLUE='\033[1;34m'
YELLOW='\033[1;33m'
RED='\033[1;31m'
NORMAL='\033[0;39m'

# MySpeed-CN Docker Installer
# Supports both docker run and docker compose

if [ $EUID -ne 0 ]; then
    echo -e "${RED}✗ ABORTED${NORMAL}"
    echo -e "${NORMAL}This installation requires root privileges. Please run with sudo or as root.${NORMAL}"
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}Docker is not installed. Installing Docker...${NORMAL}"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}✗ Failed to install Docker${NORMAL}"
        exit 1
    fi
    echo -e "${GREEN}✓ Docker installed successfully${NORMAL}"
fi

# Check for docker compose
if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
elif command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
else
    COMPOSE_CMD=""
fi

INSTALLATION_PATH="/opt/myspeed-cn"
mkdir -p "$INSTALLATION_PATH"

echo -e "${BLUE}╔══════════════════════════════════════╗${NORMAL}"
echo -e "${BLUE}║     MySpeed-CN Docker Installer      ║${NORMAL}"
echo -e "${BLUE}╚══════════════════════════════════════╝${NORMAL}"
echo ""

# Ask for installation method
echo -e "${BLUE}Select installation method:${NORMAL}"
echo -e "  ${GREEN}1)${NORMAL} Docker Compose (recommended)"
echo -e "  ${GREEN}2)${NORMAL} Docker Run (simple)"
echo ""
read -p "Enter choice [1-2]: " CHOICE

case $CHOICE in
    1)
        if [ -z "$COMPOSE_CMD" ]; then
            echo -e "${RED}✗ Docker Compose not available. Using Docker Run instead.${NORMAL}"
            CHOICE=2
        fi
        ;;
    2)
        ;;
    *)
        echo -e "${YELLOW}Invalid choice. Using Docker Compose.${NORMAL}"
        CHOICE=1
        ;;
esac

# Ask for port
read -p "Enter HTTP port [5216]: " PORT
PORT=${PORT:-5216}

# Ask for timezone
read -p "Enter timezone [Asia/Shanghai]: " TIMEZONE
TIMEZONE=${TIMEZONE:-Asia/Shanghai}

if [ "$CHOICE" = "1" ]; then
    # Docker Compose installation
    echo -e "${BLUE}Creating docker-compose.yml...${NORMAL}"
    cat << EOF > "$INSTALLATION_PATH/docker-compose.yml"
version: '3.8'

services:
  myspeed:
    image: macrwfuse/myspeed-cn:latest
    container_name: myspeed-cn
    ports:
      - "${PORT}:5216"
    volumes:
      - myspeed-data:/myspeed/data
    environment:
      - TZ=${TIMEZONE}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5216/api/info"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s

volumes:
  myspeed-data:
EOF

    echo -e "${GREEN}Starting MySpeed-CN...${NORMAL}"
    cd "$INSTALLATION_PATH" && $COMPOSE_CMD up -d

else
    # Docker Run installation
    echo -e "${GREEN}Starting MySpeed-CN...${NORMAL}"
    docker run -d \
        --name myspeed-cn \
        -p "${PORT}:5216" \
        -v myspeed-data:/myspeed/data \
        -e TZ="${TIMEZONE}" \
        --restart unless-stopped \
        macrwfuse/myspeed-cn:latest
fi

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}╔══════════════════════════════════════╗${NORMAL}"
    echo -e "${GREEN}║   MySpeed-CN installed successfully! ║${NORMAL}"
    echo -e "${GREEN}╚══════════════════════════════════════╝${NORMAL}"
    echo ""
    echo -e "${BLUE}Access:${NORMAL} http://localhost:${PORT}"
    echo -e "${BLUE}Data:${NORMAL} ${INSTALLATION_PATH}/data"
    echo ""
    echo -e "${YELLOW}Commands:${NORMAL}"
    echo -e "  View logs:    ${GREEN}docker logs -f myspeed-cn${NORMAL}"
    echo -e "  Stop:         ${GREEN}docker stop myspeed-cn${NORMAL}"
    echo -e "  Restart:      ${GREEN}docker restart myspeed-cn${NORMAL}"
    echo -e "  Update:       ${GREEN}docker pull macrwfuse/myspeed-cn:latest && docker restart myspeed-cn${NORMAL}"
else
    echo -e "${RED}✗ Failed to start MySpeed-CN${NORMAL}"
    exit 1
fi
