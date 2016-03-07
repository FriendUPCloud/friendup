<?php
/*******************************************************************************
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
*******************************************************************************/

// 2. Setup standard dock items
$dockItems = array(
	array( 'Dock', 'A simple dock desklet' ),
	array( 'Dingo', 'A command line interface' ),
	array( 'Artisan', 'A programmers editor' ),
	array( 'Author', 'A word processor' ),
	array( 'Wallpaper', 'Select a wallpaper' )
);
$i = 0;
foreach( $dockItems as $r )
{
	$d = new dbIO( 'DockItem' );
	$d->Application = $r[0];
	$d->ShortDescription = $r[1];
	$d->UserID = $User->ID;
	$d->SortOrder = $i++;
	$d->Parent = 0;
	$d->Save();
}

?>
