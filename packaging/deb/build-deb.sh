#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
VERSION="0.2.0"
ARCH="amd64"
OUTPUT_DIR="${ROOT_DIR}/dist-release"
BUILD_TMP=$(mktemp -d /tmp/ltm-deb-XXXXXX)

cleanup() {
    rm -rf "${BUILD_TMP}"
}
trap cleanup EXIT

echo "Building Debian package for Linux Traffic Manager v${VERSION} (${ARCH})..."

mkdir -p "${OUTPUT_DIR}"
mkdir -p "${BUILD_TMP}/deb"
mkdir -p "${BUILD_TMP}/data/usr/bin"
mkdir -p "${BUILD_TMP}/data/usr/share/applications"
mkdir -p "${BUILD_TMP}/data/usr/share/icons/hicolor/scalable/apps"
mkdir -p "${BUILD_TMP}/data/usr/share/doc/linux-traffic-manager"
mkdir -p "${BUILD_TMP}/control"

echo "2.0" > "${BUILD_TMP}/deb/debian-binary"

cp "${ROOT_DIR}/target/release/linux-traffic-manager" "${BUILD_TMP}/data/usr/bin/linux-traffic-manager"
chmod 755 "${BUILD_TMP}/data/usr/bin/linux-traffic-manager"

cp "${ROOT_DIR}/packaging/linux-traffic-manager.desktop" "${BUILD_TMP}/data/usr/share/applications/"
cp "${ROOT_DIR}/assets/icons/app-icon.svg" "${BUILD_TMP}/data/usr/share/icons/hicolor/scalable/apps/linux-traffic-manager.svg"
cp "${ROOT_DIR}/LICENSE" "${BUILD_TMP}/data/usr/share/doc/linux-traffic-manager/copyright"

cat << EOF > "${BUILD_TMP}/control/control"
Package: linux-traffic-manager
Version: ${VERSION}
Section: net
Priority: optional
Architecture: ${ARCH}
Maintainer: masyaslasher <masyaslasher@users.noreply.github.com>
Depends: libc6, libwebkit2gtk-4.1-0 | libwebkit2gtk-4.0-37, libgtk-3-0
Installed-Size: 8500
Description: Modern network traffic control center for Linux
 Linux Traffic Manager (LTM) is a lightweight, privacy-focused
 network traffic monitor and control center for Linux desktops,
 built with Rust and Tauri 2.
EOF

tar -czf "${BUILD_TMP}/deb/control.tar.gz" -C "${BUILD_TMP}/control" .
tar -czf "${BUILD_TMP}/deb/data.tar.gz" -C "${BUILD_TMP}/data" .

DEB_NAME="linux-traffic-manager_${VERSION}_${ARCH}.deb"
cd "${BUILD_TMP}/deb"
ar rcs "${OUTPUT_DIR}/${DEB_NAME}" debian-binary control.tar.gz data.tar.gz

echo "Successfully built ${OUTPUT_DIR}/${DEB_NAME}"
