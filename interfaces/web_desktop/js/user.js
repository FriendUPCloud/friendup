/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

/*******************************************************************************
*                                                                              *
* User object manages sessions, login and logout                               *
*                                                                              *
*******************************************************************************/

Friend = window.Friend || {};

Friend.User = {
    // Vars --------------------------------------------------------------------
    State: 'offline',
    NetworkState: 'offline',
    AccessToken: null,
    // Methods -----------------------------------------------------------------
    // Log into Friend Core
    Login: function()
    {
        return false;
    },
    Relogin: function()
    {
        return false;
    },
    Logout: function()
    {
        return false;
    }
};
