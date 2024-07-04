module.exports = {
  packagerConfig: {
    icon: './icons/all/icon'
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      platforms: ['win32'], // optional
      config: {
        // An URL to an ICO file to use as the application icon (displayed in Control Panel > Programs and Features).
        //iconUrl: 'https://url/to/icon.ico',
        // The ICO file to use as the icon for the generated Setup.exe
        setupIcon: './icons/win/icon.ico',
        name: "The Robium Connecter."
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin', 'win32'],
      config: {
        icon: './icons/mac/icon.icns',
        name: "The Robium Connecter."
      }
    },
    {
      name: '@electron-forge/maker-deb',
      config: {
        options: {
          icon: './icons/png/1024x1024.png'
        }
      },
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {
        options: {
          icon: './icons/png/1024x1024.png'
        }
      },
    },
    {
      name: '@electron-forge/maker-dmg',
      config: {
        icon: './icons/mac/icon.icns'
      }
    },
  ],
};
