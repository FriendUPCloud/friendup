/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/
/** @file
 *
 * Friend API definition - Version 1.2
 * 
 * API versions numbers to match Friend version number
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 13/09/2018
 */

// Indicates sources where source code should be copied on BOTH levels
// Faster, same level of security as the applications.
// For short and fast utility functions etc.
Friend.APIDirectSources = [];
Friend.APIDirectSources.push( 'System:js/utils/utilities.js' );

// DOS
// TODO: Reenable when it works
/*Friend.addToAPI( 'Friend.DOS.getServerURL', [ 'path', 'options', 'callback', 'extra' ], { tags: '#callback #direct', source: 'System:js/io/DOS.js' } );
Friend.addToAPI( 'Friend.DOS.loadFile', [ 'path', 'options', 'callback', 'extra' ], { tags: '#callback ', source: 'System:js/io/DOS.js' } );
Friend.addToAPI( 'Friend.DOS.getDisks', [ 'options', 'callback', 'extra' ], { tags: '#callback ', source: 'System:js/io/DOS.js' } );
Friend.addToAPI( 'Friend.DOS.getDirectory', [ 'path', 'options', 'callback', 'extra' ], { tags: '#callback ', source: 'System:js/io/DOS.js' } );
Friend.addToAPI( 'Friend.DOS.executeJSX', [ 'path', 'arguments', 'callback', 'extra' ], { tags: '#callback ', source: 'System:js/io/DOS.js' } );
Friend.addToAPI( 'Friend.DOS.isFriendNetworkDrive', [ 'path', 'callback', 'extra' ], { tags: '#direct ', source: 'System:js/io/DOS.js' } );
Friend.addToAPI( 'Friend.DOS.getDriveInfo', [ 'path', 'callback', 'extra' ], { tags: '#callback ', source: 'System:js/io/DOS.js' } );
Friend.addToAPI( 'Friend.DOS.getFileAccess', [ 'path', 'callback', 'extra' ], { tags: '#callback ', source: 'System:js/io/DOS.js' } );
Friend.addToAPI( 'Friend.DOS.getFileInfo', [ 'path', 'callback', 'extra' ], { tags: '#callback ', source: 'System:js/io/DOS.js' } );*/

// Friend Network Power sharing
Friend.addToAPI( 'Friend.Network.Power.changeFriendNetworkSettings', [ 'options', 'callback', 'extra' ], { tags: '#callback ' } );
Friend.addToAPI( 'Friend.Network.Power.registerApplication', [ 'options', 'callback', 'extra' ], { tags: '#callback ' } );
Friend.addToAPI( 'Friend.Network.Power.unregisterApplication', [ 'powerApplicationId', 'options', 'callback', 'extra' ], { tags: '#callback ' } );
Friend.addToAPI( 'Friend.Network.Power.sendMessageToAllHelpers', [ 'powerApplicationId', 'message', 'callback', 'extra' ], { tags: '#callback ' } );
Friend.addToAPI( 'Friend.Network.Power.sendMessageToHelper', [ 'powerApplicationId', 'helperId', 'message', 'callback', 'extra' ], { tags: '#callback ' } );
Friend.addToAPI( 'Friend.Network.Power.getInformation', [ 'options', 'callback', 'extra' ], { tags: '#direct ' } );
Friend.addToAPI( 'Friend.Network.Power.loadWorkers', [ 'controlId', 'name', 'pathOrCode', 'options', 'callback', 'extra' ], { tags: '#callback ' } );
Friend.addToAPI( 'Friend.Network.Power.run', [ 'controlId', 'options', 'callback', 'extra' ], { tags: '#callback ' } );
Friend.addToAPI( 'Friend.Network.Power.pause', [ 'controlId', 'options', 'callback', 'extra' ], { tags: '#callback ' } );
Friend.addToAPI( 'Friend.Network.Power.resume', [ 'controlId', 'options', 'callback', 'extra' ], { tags: '#callback ' } );
Friend.addToAPI( 'Friend.Network.Power.abort', [ 'controlId', 'options', 'callback', 'extra' ], { tags: '#callback ' } );
Friend.addToAPI( 'Friend.Network.Power.reset', [ 'controlId', 'options', 'callback', 'extra' ], { tags: '#callback ' } );

// Utilities
Friend.addToAPI( 'Friend.Utilities.getClass', [ 'source', 'callback', 'extra' ], { tags: '#direct' } );
Friend.addToAPI( 'Friend.Utilities.convertImageToBase64', [ 'pathOrImage', 'callback', 'width', 'height', 'extra' ], { tags: '#direct #callback' } );
Friend.addToAPI( 'Friend.Utilities.getFileName', [ 'path', 'callback', 'extra' ], { tags: '#direct' } );
Friend.addToAPI( 'Friend.Utilities.getFileExtension', [ 'path', 'callback', 'extra' ], { tags: '#direct' } );
Friend.addToAPI( 'Friend.Utilities.getNextPowerOfTwo', [ 'value', 'callback', 'extra' ], { tags: '#direct' } );
Friend.addToAPI( 'Friend.Utilities.isPowerOfTwo', [ 'n', 'callback', 'extra' ], { tags: '#direct' } );
Friend.addToAPI( 'Friend.Utilities.isObject', [ 'item', 'callback', 'extra' ], { tags: '#direct' } );
Friend.addToAPI( 'Friend.Utilities.isArray', [ 'object', 'callback', 'extra' ], { tags: '#direct' } );
Friend.addToAPI( 'Friend.Utilities.getColorString', [ 'r', 'g', 'b', 'callback', 'extra' ], { tags: '#direct' } );
Friend.addToAPI( 'Friend.Utilities.getColorsFromString', [ 'color', 'callback', 'extra' ], { tags: '#direct' } );
Friend.addToAPI( 'Friend.Utilities.getPixelColor', [ 'imageData', 'x', 'y', 'width', 'height', 'callback', 'extra' ], { tags: '#direct' } );
Friend.addToAPI( 'Friend.Utilities.trimString', [ 'str', 'callback', 'extra' ], { tags: '#direct' } );
Friend.addToAPI( 'Friend.Utilities.isNumber', [ 'c', 'callback', 'extra' ], { tags: '#direct' } );
Friend.addToAPI( 'Friend.Utilities.isLetter', [ 'c', 'callback', 'extra' ], { tags: '#direct' } );
Friend.addToAPI( 'Friend.Utilities.cleanArray', [ 'arr', 'exclude', 'callback', 'extra' ], { tags: '#direct' } );
Friend.addToAPI( 'Friend.Utilities.Tags.scan', [ 'tagString', 'tagFilter', 'callback', 'extra' ], { tags: '#direct' } );
