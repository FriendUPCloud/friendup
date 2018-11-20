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
 * Tree engine interface elements
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 04/03/2018
 */
Friend = window.Friend || {};
Friend.Tree.UI = Friend.Tree.UI || {};
Friend.Tree.UI.RenderItems = Friend.Tree.UI.RenderItems || {};

Friend.Tree.UI.init = function( callback )
{
	var scriptList =
	[
        "/webclient/js/tree/ui/uiArrow.js",
        "/webclient/js/tree/ui/uiButton.js",
        "/webclient/js/tree/ui/uiCheckBox.js",
        "/webclient/js/tree/ui/uiColorBox.js",
        "/webclient/js/tree/ui/uiComboBox.js",
        "/webclient/js/tree/ui/uiDialog.js",
        "/webclient/js/tree/ui/uiList.js",
        "/webclient/js/tree/ui/uiMessageBox.js",
        "/webclient/js/tree/ui/uiProcesses.js",
        "/webclient/js/tree/ui/uiProgressBar.js",
        "/webclient/js/tree/ui/uiRadioButton.js",
        "/webclient/js/tree/ui/uiSlider.js",
        "/webclient/js/tree/ui/uiText.js",
        "/webclient/js/tree/ui/uiTextBox.js",
        "/webclient/js/tree/ui/uiTreeBox.js",
        "/webclient/js/tree/ui/uiGroup.js",
        "/webclient/js/tree/ui/uiEdit.js",
        "/webclient/js/tree/ui/uiTabs.js",
        "/webclient/js/tree/ui/uiTool.js",
        "/webclient/js/tree/ui/uiToolbar.js",
        "/webclient/js/tree/ui/uiResizeBar.js",
        "/webclient/js/tree/ui/uiMenu.js",
        "/webclient/js/tree/ui/uiHint.js",
    ];
	Friend.Tree.include( scriptList, function( response )
	{
		callback( response );
	} );
};

