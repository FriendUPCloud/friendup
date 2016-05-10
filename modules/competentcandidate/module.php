<?php

global $User, $SqlDatabase;

$t = new dbTable( 'CmpCompetancyGroup' );
if( !$t->load() )
{
	include_once( 'modules/competentcandidate/include/dbsetup.php' );
}

?>
