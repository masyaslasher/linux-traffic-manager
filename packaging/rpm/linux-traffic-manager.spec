Name:           linux-traffic-manager
Version:        0.2.0
Release:        1%{?dist}
Summary:        Modern, lightweight and privacy-focused network traffic monitor for Linux

License:        MIT
URL:            https://github.com/masyaslasher/linux-traffic-manager
Source0:        %{name}-%{version}.tar.gz

BuildRequires:  rust >= 1.80
BuildRequires:  cargo
BuildRequires:  nodejs >= 20
BuildRequires:  webkit2gtk4.1-devel
BuildRequires:  gtk3-devel
BuildRequires:  libsoup3-devel
BuildRequires:  javascriptcoregtk4.1-devel
BuildRequires:  openssl-devel
BuildRequires:  librsvg2-devel

Requires:       webkit2gtk4.1
Requires:       gtk3
Requires:       libsoup3
Requires:       openssl

%description
Linux Traffic Manager (LTM) is an open-source, privacy-first desktop network monitor.
It provides real-time visibility into bandwidth speeds, network interfaces, active sockets,
process connection attribution, and automated network diagnostics with an AMOLED dark theme.

%prep
%autosetup

%build
# Build frontend and Rust binary
cd frontend
pnpm install
pnpm build
cd ..
cargo build --release --workspace

%install
rm -rf %{buildroot}
install -D -m 0755 target/release/linux-traffic-manager %{buildroot}%{_bindir}/linux-traffic-manager
install -D -m 0644 packaging/linux-traffic-manager.desktop %{buildroot}%{_datadir}/applications/linux-traffic-manager.desktop
install -D -m 0644 assets/icons/app-icon.svg %{buildroot}%{_datadir}/icons/hicolor/scalable/apps/linux-traffic-manager.svg

%files
%license LICENSE
%doc README.md CHANGELOG.md
%{_bindir}/linux-traffic-manager
%{_datadir}/applications/linux-traffic-manager.desktop
%{_datadir}/icons/hicolor/scalable/apps/linux-traffic-manager.svg

%changelog
* Fri Nov 06 2026 LTM Maintainers <maintainers@linux-traffic-manager.local> - 0.1.0-1
- Initial Fedora RPM release.
