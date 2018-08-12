/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
*                                                                              *
* This program is free software: you can redistribute it and/or modify         *
* it under the terms of the GNU Affero General Public License as published by  *
* the Free Software Foundation, either version 3 of the License, or            *
* (at your option) any later version.                                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* GNU Affero General Public License for more details.                          *
*                                                                              *
* You should have received a copy of the GNU Affero General Public License     *
* along with this program.  If not, see <http://www.gnu.org/licenses/>.        *
*                                                                              *
*****************************************************************************©*/
/** @file
 *
 * Default Themes Definitions
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 08/11/2017
 */
Friend = window.Friend || {};
Friend.Themes = Friend.Themes || {};

Friend.Themes.defaultWallpapers =
[
	{
		name: 'Autumn',
		image: '/webclient/theme/wallpaper/Autumn.jpg'
	},
	{
		name: 'Bug',
		image: '/webclient/theme/wallpaper/Bug.jpg'
	},
	{
		name: 'CalmSea.jpg',
		image: '/webclient/theme/wallpaper/CalmSea.jpg'
	},
	{
		name: 'CityLights',
		image: '/webclient/theme/wallpaper/CityLights.jpg'
	},
	{
		name: 'Domestic',
		image: '/webclient/theme/wallpaper/Domestic.jpg'
	},
	{
		name: 'EveningCalm',
		image: '/webclient/theme/wallpaper/EveningCalm.jpg'
	},
	{
		name: 'Field',
		image: '/webclient/theme/wallpaper/Field.jpg'
	},
	{
		name: 'FireCones',
		image: '/webclient/theme/wallpaper/FireCones.jpg'
	},
	{
		name: 'FjordCoast',
		image: '/webclient/theme/wallpaper/FjordCoast.jpg'
	},
	{
		name: 'Freedom',
		image: '/webclient/theme/wallpaper/Freedom.jpg'
	},
	{
		name: 'GroundedLeaves',
		image: '/webclient/theme/wallpaper/GroundedLeaves.jpg'
	},
	{
		name: 'NightClouds',
		image: '/webclient/theme/wallpaper/NightClouds.jpg'
	},
	{
		name: 'Omen',
		image: '/webclient/theme/wallpaper/Omen.jpg'
	},
	{
		name: 'RedLeaf',
		image: '/webclient/theme/wallpaper/RedLeaf.jpg'
	},
	{
		name: 'SummerLeaf',
		image: '/webclient/theme/wallpaper/SummerLeaf.jpg'
	},
	{
		name: 'TechRoad',
		image: '/webclient/theme/wallpaper/TechRoad.jpg'
	},
	{
		name: 'TrailBlazing',
		image: '/webclient/theme/wallpaper/TrailBlazing.jpg'
	},
	{
		name: 'TreeBranch',
		image: '/webclient/theme/wallpaper/TreeBranch.jpg'
	},
	{
		name: 'WindyOcean',
		image: '/webclient/theme/wallpaper/WindyOcean.jpg'
	}
];
Friend.Themes.defaultThemes =
[
	{
		name: 'Friend',
		icons:
		[
			{
				class: 'File',
				image: '/iconthemes/friendup/80/file_unknown.png'
				//mouseOver: 'mimetypes/file_unknown.png',
				//selected: '/mimetypes/file_unknown.png'
			},
			{
				class: 'Drive',
				image: '/iconthemes/friendup/80/disk.png'
			},
			{
				class: 'Directory.Upload',
				image: '/iconthemes/friendup/80/drawer.png',
				selected: '/iconthemes/friendup/80/drawer_open.png'
			},
			{
				class: 'Directory',
				image: '/iconthemes/friendup/80/drawer.png',
				selected: '/iconthemes/friendup/80/drawer_open.png'
			},
			{
				class: 'DirectoryBrown',
				image: '/iconthemes/friendup/80/drawer_brown.png',
				selected: '/iconthemes/friendup/80/drawer_brown_open.png'
			},
			{
				class: 'NetworkDirectory',
				image: '/iconthemes/friendup/80/drawer.png',
				selected: '/iconthemes/friendup/80/drawer_open.png'
			},
			{
				class: 'Arena',
				image: '/iconthemes/friendup/80/doc_unknown.png'
			},
			{
				class: 'System',
				image: '/iconthemes/friendup/80/disk_system.png'
			},
			{
				class: 'Home',
				image: '/iconthemes/friendup/80/disk_home.png'
			},
			{
				class: 'Application',
				image: '/iconthemes/friendup/80/doc_script.png'
			},
			{
				class: 'Trashcan',
				image: '/iconthemes/friendup/80/trash.png',
				mouseOver: '',
				selected: '/'
			},
			{
				class: 'Ram',
				image: '/webclient/gfx/icons/64x64/devices/media-flash.png'
			},
			{
				class: 'Door',
				image: '/iconthemes/friendup/80/disk.png'
			},
			{
				class: 'SystemDisk',
				image: '/iconthemes/friendup/80/disk_system.png'
			},
			{
				class: 'Assign',
				image: '/iconthemes/friendup/80/disk_bookmark_blue.png'
			},
			{
				class: 'article',
				image: '/iconthemes/friendup/80/doc_unknown.png'
			},
			{
				class: 'TypeJPG',
				image: '/iconthemes/friendup/80/images_jpg.png'
			},
			{
				class: 'TypeJPEG',
				image: '/iconthemes/friendup/80/images_jpg.png'
			},
			{
				class: 'TypePNG',
				image: '/iconthemes/friendup/80/images_jpg.png'
			},
			{
				class: 'TypeGIF',
				image: '/iconthemes/friendup/80/images_png.png'
			},
			{
				class: 'TypeBMP',
				image: '/iconthemes/friendup/80/images_png.png'
			},
			{
				class: 'TypeDOC',
				image: '/iconthemes/friendup/80/doc_doc.png'
			},
			{
				class: 'TypeODT',
				image: '/iconthemes/friendup/80/doc_odt.png'
			},
			{
				class: 'TypeABW',
				image: '/iconthemes/friendup/80/doc_abw.png'
			},
			{
				class: 'TypeDOCX',
				image: '/iconthemes/friendup/80/doc_docx.png'
			},
			{
				class: 'TypePDF',
				image: '/iconthemes/friendup/80/doc_pdf.png'
			},
			{
				class: 'TypeSVG',
				image: '/iconthemes/friendup/80/images_svg.png'
			},
			{
				class: 'TypeGoogleDocs',
				image: '/iconthemes/friendup/80/doc_gdoc.png'
			},
			{
				class: 'TypeWebUrl',
				image: '/iconthemes/friendup/80/doc_url.png'
			},
			{
				class: 'TypeTXT',
				image: '/iconthemes/friendup/80/doc_txt.png'
			},
			{
				class: 'TypeRUN',
				image: '/iconthemes/friendup/80/doc_shellscript.png'
			},
			{
				class: 'TypeMP3',
				image: '/iconthemes/friendup/80/audio_mp3.png'
			},
			{
				class: 'TypeOGG',
				image: '/iconthemes/friendup/80/audio_ogg.png'
			},
			{
				class: 'TypeWAV',
				image: '/iconthemes/friendup/80/audio_wav.png'
			},
			{
				class: 'TypeFLAC',
				image: '/iconthemes/friendup/80/audio_flac.png'
			},
			{
				class: 'TypeHTML',
				image: '/iconthemes/friendup/80/doc_html.png'
			},
			{
				class: 'TApplication',
				image: '/iconthemes/friendup/80/treeapplication.png'
			},
			{
				class: 'TypeFPkg',
				image: '/iconthemes/friendup/80/archive_fpkg.png'
			},
			{
				class: 'TypeZip',
				image: '/iconthemes/friendup/80/archive_zip.png'
			},
			{
				class: 'TypeJS',
				image: '/themes/friendup/gfx/icons/Custom/icon_js.png'
			},
			{
				class: 'TypeJSX',
				image: '/iconthemes/friendup/80/doc_script.png'
			},
			{
				class: 'TypePHP',
				image: '/iconthemes/friendup/80/doc_php.png'
			},
			{
				class: 'TypeAVI',
				image: '/iconthemes/friendup/80/video_avi.png'
			},
			{
				class: 'TypeFLV',
				image: '/iconthemes/friendup/80/video_flv.png'
			},
			{
				class: 'TypeMOV',
				image: '/iconthemes/friendup/80/video_mov.png'
			},
			{
				class: 'TypeWEBM',
				image: '/iconthemes/friendup/80/video_webm.png'
			},
			{
				class: 'TypeMPEG',
				image: '/iconthemes/friendup/80/video_mpg.png'
			},
			{
				class: 'TypeOGV',
				image: '/iconthemes/friendup/80/video_ogv.png'
			},
			{
				class: 'TypeMPG',
				image: '/iconthemes/friendup/80/video_mpg.png'
			},
			{
				class: 'TypeMOV',
				image: '/iconthemes/friendup/80/video_mp4.png'
			},
			{
				class: 'Devs_Drawer_DOSDrivers',
				image: '/iconthemes/friendup/80/drawer_gray.png'
			},
			{
				class: 'Devs_Drawer_Cores',
				image: '/iconthemes/friendup/80/drawer_gray.png'
			},
			{
				class: 'Devs_Drawer_Sessions',
				image: '/iconthemes/friendup/80/drawer_gray.png'
			},
			{
				class: 'TypeMP4',
				image: '/mimetypes/application-vnd.rn-realmedia.png'
			},
			{
				class: 'FriendCore',
				image: '/iconthemes/friendup/80/friendcore.png'
			},
			{
				class: 'DeviceSession',
				image: '/iconthemes/friendup/80/usersession.png'
			},
			{
				class: 'Devs_Drawer_DOSDrivers',
				image: '/iconthemes/friendup/80/drawer_gray_open.png'
			},
			{
				class: 'DOSDriver',
				image: '/iconthemes/friendup/80/dosdriver.png'
			},
			{
				class: 'MetaFile',
				image: '/iconthemes/friendup/80/file_meta.png'
			},
			{
				class: 'Module',
				image: '/iconthemes/friendup/80/module.png'
			},
			{
				class: 'System_Dormant_Function',
				image: '/iconthemes/friendup/80/doc_script.png'
			},
			{
				class: 'System_File_Meta',
				image: '/iconthemes/friendup/80/file_meta.png'
			},
			{
				class: 'Devs_Drawer_DOSDrivers',
				image: '/iconthemes/friendup/80/drawer_gray_open.png'
			},
			{
				class: 'Devs_Drawer_DOSDrivers',
				image: '/iconthemes/friendup/80/drawer_gray_open.png'
			},
			{
				class: 'System_Dormant_Function',
				image: '/mimetypes/application-x-object.png'
			},
			{
				class: 'System_File_Meta',
				image: '/mimetypes/application-sxw.png'
			},
			{
				class: 'System_Library',
				image: '/iconthemes/friendup/80/library.png'
			},
			{
				class: 'System_Tools',
				image: '/iconthemes/friendup/80/drawer_small_tools.png',
				selected: '/iconthemes/friendup/80/drawer_small_tools_open.png'
			},
			{
				class: 'System_Settings',
				image: '/iconthemes/friendup/80/drawer_small_system.png',
				selected: '/iconthemes/friendup/80/drawer_small_system_open.png'
			},
			{
				class: 'System_Documentation',
				image: '/iconthemes/friendup/80/drawer_small_documentation.png',
				selected: '/iconthemes/friendup/80/drawer_small_documentation_open.png'
			},
			{
				class: 'System_Modules',
				image: '/iconthemes/friendup/80/drawer_small_modules.png',
				selected: '/iconthemes/friendup/80/drawer_small_modules_open.png'
			},
			{
				class: 'System_Software',
				image: '/iconthemes/friendup/80/drawer_small_software.png',
				selected: '/iconthemes/friendup/80/drawer_small_software_open.png'
			},
			{
				class: 'System_Functions',
				image: '/iconthemes/friendup/80/drawer_small_functions.png',
				selected: '/iconthemes/friendup/80/drawer_small_functions_open.png'
			},
			{
				class: 'System_Devices',
				image: '/iconthemes/friendup/80/drawer_small_devices.png',
				selected: '/iconthemes/friendup/80/drawer_small_devices_open.png'
			},
			{
				class: 'System_Libraries',
				image: '/iconthemes/friendup/80/drawer_small_libraries.png',
				selected: '/iconthemes/friendup/80/drawer_small_libraries_open.png'
			},
			{
				class: 'System_Trashcan',
				image: '/iconthemes/friendup/80/trash.png'
			},
			{
				class: 'System_Trashcan',
				image: '/iconthemes/friendup/80/trash.png'			// TODO: get image full
			},
			{
				class: 'Prefs_Wallpaper',
				image: '/themes/friendup/gfx/icons/Custom/apps/Wallpaper.png'	// TODO
			},
			{
				class: 'Prefs_Screens',
				image: '/themes/friendup/gfx/icons/Custom/apps/Screens.png'		// TODO
			},
			{
				class: 'Prefs_Security',
				image: '/themes/friendup/gfx/icons/Custom/apps/Security.png'	/* TODO: Fix this */
			},
			{
				class: 'Prefs_Software',
				image: '/themes/friendup/gfx/icons/Custom/apps/Software.png' /* TODO: Fix this */
			},
			{
				class: 'Prefs_Dock',
				image: '/themes/friendup/gfx/icons/Custom/apps/Dock.png' 	/* TODO: Fix this */
			},
			{
				class: 'Prefs_Startup',
				image: '/themes/friendup/gfx/icons/Custom/apps/Startup.png' 	/* TODO: Fix this */
			},
			{
				class: 'Prefs_Users',
				image: '/themes/friendup/gfx/icons/Custom/apps/Users.png'	/* TODO: Fix this */
			},
			{
				class: 'Prefs_Account',
				image: '/themes/friendup/gfx/icons/Custom/apps/Account.png' 	/* TODO: Fix this */
			},
			{
				class: 'Prefs_Mimetypes',
				image: '/themes/friendup/gfx/icons/Custom/apps/Mimetypes.png' /* TODO: Fix this */
			},
			{
				class: 'Prefs_DiskCatalog',
				image: '/themes/friendup/gfx/icons/Custom/apps/DiskCatalog.png' 	/* TODO: Fix this */
			},
			{
				class: 'Prefs_Language',
				image: '/themes/friendup/gfx/icons/Custom/apps/Language.png' 	/* TODO: Fix this */
			},
			{
				class: 'Prefs_Looknfeel',
				image: '/themes/friendup/gfx/icons/Custom/apps/Looknfeel.png' 	/* TODO: Fix this */
			},
			{
				class: 'Tool_ApplicationManager',
				image: '/iconthemes/friendup/80/apps/application_manager.png'
			},
			{
				class: 'Tool_SystemDiagnostics',
				image: '/iconthemes/friendup/80/apps/system_diagnostic.png'
			}
		]
	}
];
