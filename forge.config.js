module.exports = {
  packagerConfig: {
    icon: './icons/all/icon'
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        // An URL to an ICO file to use as the application icon (displayed in Control Panel > Programs and Features).
        //iconUrl: 'https://url/to/icon.ico',
        // The ICO file to use as the icon for the generated Setup.exe
        setupIcon: './icons/win/icon.ico',
        icon: './icons/win/icon.ico',
        loadingGif: './icons/png/128x128.gif',
        name: 'RobiumConnecter',
        fixUpPaths: true,
        exe: 'RobiumConnecter.exe',
        setupExe: 'RobiumConnecterSetup.exe'
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin', 'win32'],
      config: {
        icon: './icons/mac/icon.icns',
        name: "RobiumConnecter"
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
  ],
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'PaulOrlov',
          name: 'robiumconnecter'
        },
        prerelease: false,
        draft: true
      }
    }
  ]
};
