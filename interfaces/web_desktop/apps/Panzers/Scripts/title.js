
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
 * Panzers! Title page
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 30/08/2017
 */

/**
 * Title
 *
 * The Title is a normal Tree item on which we add images and buttons
 *
 * @param (object) tree the Tree engine
 * @param (string) name the name of the item
 * @param (object) flags creation flags
 * @return (object) newly created Title item
 *
 * Flags
 *
 * game: (object) the calling game
 * network: (object) (optional) the network object if network game
 */
function Title( tree, name, flags )
{
	this.network = false;
	this.playMusic = true;
	this.playSounds = true;
	this.usersList = false; 			// When ending a multiplayer game, returns the list of users...
	Friend.Tree.Items.init( this, tree, name, 'Title', flags );
	this.registerEvents( 'refresh' );

	// Direct the network messages here.
	this.root.network.caller = this;
	this.root.network.messages = this.handleMultiPlayerMessages;

	// Links dormant to Title
	this.dormant = this.root.dormant;
	this.dormant.setFunctions( [ 'practice', 'setMusic', 'setSounds' ] );
	this.dormant.caller = this;
	this.dormant.execute = this.onDormantExecute;

	// Background image
	debugger;
	this.background = new Friend.Tree.Game.Bitmap( this.tree, 'titlepic',
	{
		root: this.root,
		parent: this,
		x: 0,
		y: 0,
		z: 1,
		width: '100%',
		height: '100%',
		imageName: 'title'
	} );

	this.vGroup = new Friend.Tree.UI.VerticalGroup( this.tree, 'vGroup', 
	{
		root: this.root,
		parent: this.background,
		x: 'left',
		y: 'top',
		width: '100%',
		height: '100%',
		sizes: [ 'calc( 100% - 80 )', '80' ]
	} );
	this.hGroup = new Friend.Tree.UI.HorizontalGroup( this.tree, 'hGroup', 
	{
		root: this.root,
		parent: this.vGroup,
		x: 'left',
		y: 'top',
		width: '100%',
		sizes: 
		[ 
			'host.width() + 20px', 
			'connect.width()', 
			'calc( 100% - host.width() - 20 - connect.width() - practice.width() - preferences.width() - 20 )', 
			'practice.width()',
			'preferences.width() + 20px )'
		]
	} );

	// Network buttons, only if Friend Network is available
	var self = this;
	if ( this.root.friendNetworkReady )
	{
		var host = new Friend.Tree.UI.Button( this.tree, 'host',
		{
			root: this.root,
			parent: this.hGroup,
			x: 'right',
			y: 'top',
			width: 'auto',
			height: '100%',
			font: '18px sans serif',
			text: 'Host a game',
			theme: this.root.theme,
			caller: this,
			onClick: this.clickOnHost
		} );
		var connect = new Friend.Tree.UI.Button( this.tree, 'connect',
		{
			root: this.root,
			parent: this.hGroup,
			x: 'left',
			y: 'top',
			width: 'auto',
			height: '100%',
			text: 'Connect to a game',
			font: '18px sans serif',
			theme: this.root.theme,
			caller: this,
			onClick: this.clickOnConnect			// Will be called upon click
		} );
		/*
		if ( this.usersList )
		{
			new Friend.Tree.UI.Button( this.tree, 'playAgain',
			{
				root: this.root,
				parent: this.background,
				x: connect.x + connect.width + 20 * zoomX,
				y: ( 768 - 80 ) * zoomY,
				width: 200 * zoomX,
				height: 60 * zoomY,
				text: 'Play again!',
				caller: this,
				onClick: this.clickOnPlayAgain
			} );
		}
		*/
	}
	else
	{
		// Display alert message if Friend Network is not running
		if ( !this.root.networkReadyDone )
		{
			this.root.networkReadyDone = true;
			var dialog = new Friend.Tree.UI.MessageBox( this.tree, 'nonetwork',
			{
				root: this.root,
				parent: this.background,
				title: 'Panzers',
				text: 'Network gaming unavailable.',
				theme: this.root.theme,
				caller: this,
				onCancel: doCancel
			} );
			this.tree.setModal( dialog, true );
			function doCancel()
			{
				this.tree.setModal( dialog, false );
				dialog.destroy();
			}
		}
	}

	var practice = new Friend.Tree.UI.Button( this.tree, 'practice',
	{
		root: this.root,
		parent: this.hGroup,
		x: 'right',
		y: 'top',
		width: 'auto',
		height: '100%',
		font: '18px sans serif',
		text: 'Practice',
		theme: this.root.theme,
		caller: this,
		onClick: this.clickOnPractice			// Will be called upon click
	} );

	var prefs = new Friend.Tree.UI.Button( this.tree, 'preferences',
	{
		root: this.root,
		parent: this.hGroup,
		x: 'left',
		y: 'top',
		width: 'auto',
		height: '100%',
		text: 'Preferences',
		font: '18px sans serif',
		theme: this.root.theme,
		caller: this,
		onClick: this.clickOnPreferences		// Will be called upon click
	} );

	if ( false ) //this.root.friendQuest )
	{
		// Centers the image (will be automatic in next versions of the Tree engine)
		var image = this.resources.getImage( 'friendQuest' );
		var width = image.width;
		var height = image.height;
		this.friendQuestItem = new Friend.Tree.Game.Bitmap( this.tree, 'friendQuest', 
		{
			root: this.root,
			parent: this,
			z: 10,
			imageName: 'friendQuest',
			positionMode: 'centerCenter',
			resizeMode: 'none',
			width: width,
			height: height,
			visible: false
		} );
	}
	/*
	new Friend.Tree.Debug.Debugger( this.tree, 'debugger',
	{
		root: this.root,
		parent: this.background,
		z: 10
	} );
	/*new Friend.Tree.UI.RendererImage( this.tree, 'rendererOutput',
	{
		root: this.root,
		parent: this.background,
		x: 0,
		y: 0,
		width: 256,
		height: 192
	} );
*/
	this.tree.start();
	return this;
}

/**
 * clickOnHost
 *
 * Called when click on button, adds a network WaitForParticipants item
 * that will do the job
 */
Title.prototype.clickOnHost = function ()
{
	var dialog = new Friend.Tree.Game.MultiWaitForParticipants( this.tree, 'WaitForParticipants',
	{
		root: this.root,
		parent: this.background,
		// x and y will be calculated to center on parent
		width: this.width / 3,
		height: this.height / 3,
		theme: this.root.theme,
		caller: this,
		messages: this.handleMultiPlayerMessages
	} );
	this.tree.setModal( dialog, true );
};

/**
 * clickOnConnect
 *
 * Called when click on the buttonm adds a Multiplaywer WaitForGame item
 * that will do the job
 */
Title.prototype.clickOnConnect = function ()
{
	var dialog = new Friend.Tree.Game.MultiWaitForGame( this.tree, 'WaitForGame',
	{
		root: this.root,
		parent: this.background,
		// x and y will be calculated to center on parent
		width: this.width / 3,
		height: this.height / 3,
		theme: this.root.theme,
		caller: this,
		messages: this.handleMultiPlayerMessages
	} );
	this.tree.setModal( dialog, true );
};

/**
 * clickOnPractice
 *
 * Called when click on the button.
 * Creates a 'Battle' item and set Tree to it
 */
Title.prototype.clickOnPractice = function ()
{
	// Removes itself and launch the game when it is done
	var self = this;
	this.destroy( function()
	{
		// Creates and add the Battle item to Tree
		new Battle( self.tree, 'battle',
		{
			root: self.root,
			parent: self.root,
			x: 0,
			y: 0,
			z: 0,
			width: self.width,
			height: self.height,
			theme: self.root.theme,
			usersNumber: 1,
			userNumber: 0,
			playMusic: self.playMusic,
			playSounds: self.playSounds,
			noPerspective: 1,
			friendQuest: self.root.friendQuest
		} );
	} );
};

Title.prototype.onDormantExecute = function ( functionName, args )
{
	switch( functionName )
	{
		case 'practice':
			this.clickOnPractice();
			break;
		case 'setMusic':
			if ( args[ 0 ] == 'on' )
				this.playMusic = true;
			else
				this.playMusic = false;
			break;
		case 'setSounds':
			if ( args[ 0 ] == 'on' )
				this.playSounds = true;
			else
				this.playSounds = false;
			break;
	}
};

/**
 * handleMultiplayerMessages
 *
 * Handles all the messages coming from the Network object
 *
 * @param (object) msg network message
 */
Title.prototype.handleMultiPlayerMessages = function ( command, data )
{
	switch ( command )
	{
	case 'aborted':
		// Connection aborted
		case 'aborted':
			break;

		// Game start
		case 'applicationReady':

			// Destroys the title (itself)
			this.destroy();

			// Adds the Battle level to the root
			new Battle( this.tree, 'battle', 
			{
				root: this.root,
				parent: this.root,
				x: 0,
				y: 0,
				z: 0,
				width: this.width,
				height: this.height,
				theme: this.root.theme,
				playMusic: this.playMusic,
				playSounds: this.playSounds,
				usersNumber: data.usersNumber,
				userNumber: data.userNumber,
				users: data.users,
				friendQuest: this.root.friendQuest
			} );
			break;

	}
};
/**
 * render
 *
 * Calls all the sub items rendering functions
 *
 * @param (object) context the drawing context
 * @param (number) x horizontal coordinate
 * @param (number) y veertical coordinate
 * @param (number) zoom factor
 */
Title.prototype.render = function ( flags )
{
	return flags;
};

// Message Up
Title.prototype.messageUp = function ( message )
{
	return this.startProcess( message, [ 'x', 'y', 'z', 'width', 'height' ] );
};
// Will never be called
Title.prototype.messageDown = function ( message )
{
	return this.endProcess( message, [ 'x', 'y', 'z', 'width', 'height' ] );
};

/**
 * onClickPreferences
 *
 * Called when the user clicks on the preferences button
 */
Title.prototype.clickOnPreferences = function ()
{
	// Debugging: output FriendNetwork status
	FriendNetwork.list( function( message )
	{
		console.log( 'ListHosts', message.hosts );
	} );

	var dialog = new Friend.Tree.UI.Dialog( this.tree, 'preferences',
	{
		root: this.root,
		parent: this.background,
		x: 'center',
		y: 'center',
		width: 400,
		height: 150,
		title: 'Preferences',
		theme: this.root.theme,
		onCancel: onCancel,
		onOK: onOK,
		caller: this
	} );	
	var checkMusic = new Friend.Tree.UI.CheckBox( this.tree, 'checkMusic',
	{
		root: this.root,
		parent: dialog,
		x: 16,
		y: 50,
		width: 400 - 16 * 2,
		height: 16,
		theme: this.root.theme,
		text: 'Play music',
		value: this.playMusic
	} );	
	var checkSounds = new Friend.Tree.UI.CheckBox( this.tree, 'checkSounds',
	{
		root: this.root,
		parent: dialog,
		x: 16,
		y: 80,
		width: 400 - 16 * 2,
		height: 16,
		theme: this.root.theme,
		text: 'Play sounds',
		value: this.playSounds
	} );
	this.tree.setModal( dialog, true );
	
	function onCancel()
	{
		this.tree.setModal( dialog, false );
		dialog.destroy();
	}
	function onOK()
	{
		this.playSounds = checkSounds.value;
		this.playMusic = checkMusic.value;
		this.tree.setModal( dialog, false );
		dialog.destroy();
	}
};
