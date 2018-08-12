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

