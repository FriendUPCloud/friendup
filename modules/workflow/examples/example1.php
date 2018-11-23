<?php

// Just list out all workflows

$test = new WorkflowEngine( $mydatabase, 'Admin' );
die( $test->listWorkflows() );

?>
