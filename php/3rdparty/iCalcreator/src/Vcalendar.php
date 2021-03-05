<?php
/**
 * iCalcreator, the PHP class package managing iCal (rfc2445/rfc5445) calendar information.
 *
 * copyright (c) 2007-2019 Kjell-Inge Gustafsson, kigkonsult, All rights reserved
 * Link      https://kigkonsult.se
 * Package   iCalcreator
 * Version   2.28.2
 * License   Subject matter of licence is the software iCalcreator.
 *           The above copyright, link, package and version notices,
 *           this licence notice and the invariant [rfc5545] PRODID result use
 *           as implemented and invoked in iCalcreator shall be included in
 *           all copies or substantial portions of the iCalcreator.
 *
 *           iCalcreator is free software: you can redistribute it and/or modify
 *           it under the terms of the GNU Lesser General Public License as published
 *           by the Free Software Foundation, either version 3 of the License,
 *           or (at your option) any later version.
 *
 *           iCalcreator is distributed in the hope that it will be useful,
 *           but WITHOUT ANY WARRANTY; without even the implied warranty of
 *           MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *           GNU Lesser General Public License for more details.
 *
 *           You should have received a copy of the GNU Lesser General Public License
 *           along with iCalcreator. If not, see <https://www.gnu.org/licenses/>.
 *
 * This file is a part of iCalcreator.
*/

namespace Kigkonsult\Icalcreator;

use Kigkonsult\Icalcreator\Util\StringFactory;
use Kigkonsult\Icalcreator\Util\Util;
use Kigkonsult\Icalcreator\Util\SelectFactory;
use Kigkonsult\Icalcreator\Util\HttpFactory;
use Kigkonsult\Icalcreator\Util\DateTimeFactory;
use Kigkonsult\Icalcreator\Util\SortFactory;
use DateTime;
use InvalidArgumentException;
use UnexpectedValueException;
use Exception;

use function array_keys;
use function count;
use function ctype_digit;
use function end;
use function explode;
use function file_get_contents;
use function filter_var;
use function func_get_args;
use function func_num_args;
use function gethostbyname;
use function implode;
use function in_array;
use function is_array;
use function is_file;
use function is_null;
use function is_readable;
use function is_string;
use function ksort;
use function property_exists;
use function rtrim;
use function str_replace;
use function strcasecmp;
use function strlen;
use function stripos;
use function strpos;
use function strtolower;
use function strtoupper;
use function substr;
use function trim;
use function ucfirst;
use function usort;

/**
 * Vcalendar class
 *
 * @author Kjell-Inge Gustafsson, kigkonsult <ical@kigkonsult.se>
 * @since  2.28.2  2019-08-29
 */
final class Vcalendar extends IcalBase
{
    use Traits\CALSCALEtrait,
        Traits\METHODtrait,
        Traits\PRODIDtrait,
        Traits\VERSIONtrait;

    /**
     * @const
     */
    const VCALENDAR = 'Vcalendar';

    /**
     * @var string property output formats, used by CALSCALE, METHOD, PRODID and VERSION
     * @access private
     * @static
     */
    private static $FMTICAL = "%s:%s\r\n";

    /**
     * @var array  iCal component date-property collection
     * @access private
     * @static
     */
    private static $DATEPROPS  = [
        self::DTSTART, self::DTEND, self::DUE, self::CREATED, self::COMPLETED,
        self::DTSTAMP, self::LAST_MODIFIED, self::RECURRENCE_ID,
    ];

    /**
     * Constructor for calendar object
     *
     * @param array $config
     * @since  2.27.14 - 2019-02-20
     */
    public function __construct( $config = [] ) {
        static $SERVER_NAME = 'SERVER_NAME';
        static $LOCALHOST   = 'localhost';
        $this->compType = self::VCALENDAR;
        $this->setConfig(
            self::UNIQUE_ID,
            ( isset( $_SERVER[$SERVER_NAME] )) ? gethostbyname( $_SERVER[$SERVER_NAME] ) : $LOCALHOST
        );
        $this->setConfig( $config );
    }

    /**
     * Destructor
     *
     * @since  2.27.3 - 2018-12-28
     */
    public function __destruct() {
        if( ! empty( $this->components )) {
            foreach( $this->components as $cix => $comp ) {
                $this->components[$cix]->__destruct();
            }
        }
        unset(
            $this->compType,
            $this->xprop,
            $this->components,
            $this->unparsed,
            $this->config,
            $this->compix,
            $this->propIx,
            $this->propDelIx
        );
        unset(
            $this->calscale,
            $this->method,
            $this->prodid,
            $this->version
        );
    }

    /**
     * Return iCalcreator instance, factory method
     *
     * @param array $config
     * @return static
     * @static
     * @since  2.18.5 - 2013-08-29
     */
    public static function factory( $config = [] ) {
        return new self( $config );
    }

    /**
     * Return iCalcreator version
     *
     * @return string
     * @since  2.18.5 - 2013-08-29
     */
    public static function iCalcreatorVersion() {
        return trim( substr( ICALCREATOR_VERSION, strpos( ICALCREATOR_VERSION, Util::$SP1 )));
    }

    /**
     * Delete calendar property value
     *
     * @param mixed $propName bool false => X-property
     * @param int   $propIx   specific property in case of multiply occurrence
     * @return bool true on successfull delete
     * @deprecated in favor of properties delete method
     * @since  2.27.1 - 2018-12-16
     */
    public function deleteProperty( $propName = null, $propIx = null ) {
        if( empty( $propName ) || StringFactory::isXprefixed( $propName )) {
            return $this->deleteXprop( $propName, $propIx );
        }
        if( ! property_exists( $this, strtolower( $propName ))) {
            return false;
        }
        switch( $propName ) {
            case self::CALSCALE:
                return $this->deleteCalscale();
                break;
            case self::METHOD:
                return $this->deleteMethod();
                break;
            default:
                break;
        }
        return false;
    }

    /**
     * Return calendar (opt component) property value/params
     *
     * CATEGORIES, LOCATION, GEOLOCATION, PRIORITY, RESOURCES, STATUS, SUMMARY
     * DTSTART (Ymd only)
     * ATTENDEE*, CONTACT, ORGANIZER*   *:prefixed by "protocol" like "MAILTO:....
     * RECURRENCE-ID *4 (alt. "R-UID")
     * RELATED-TO, URL, UID
     * @param string $propName
     * @param int    $propIx specific property in case of multiply occurrence
     * @param bool   $inclParam
     * @return mixed
     * @since  2.27.1 - 2018-12-16
     */
    public function getProperty(
        $propName  = null,
        $propIx    = null,
        $inclParam = null
    ) {
        static $RECURRENCE_ID_UID = 'RECURRENCE-ID-UID';
        static $R_UID             = 'R-UID';
        if( empty( $propName ) || StringFactory::isXprefixed( $propName )) {
            return $this->getXprop( $propName, $propIx, $inclParam );
        }
        $propName = strtoupper( $propName );
        switch( $propName ) {
            case self::ATTENDEE:
            case self::CATEGORIES:
            case self::CONTACT:
            case self::DTSTART:
            case self::GEOLOCATION:
            case self::LOCATION:
            case self::ORGANIZER:
            case self::PRIORITY:
            case self::RESOURCES:
            case self::STATUS:
            case self::SUMMARY:
            case $RECURRENCE_ID_UID:
            case self::RELATED_TO:
            case $R_UID:
            case self::UID:
            case self::URL:
                $output = [];
                foreach( $this->components as $cix => $component ) {
                    if( ! Util::isCompInList( $component->getCompType(), self::$VCOMPS )) {
                        continue;
                    }
                    if( ! property_exists( $component, self::getInternalPropName( $propName ))) {
                        continue;
                    }
                    if( Util::isPropInList( $propName, self::$MPROPS1 )) {
                        $component->getProperties( $propName, $output );
                        continue;
                    }
                    elseif(( 3 < strlen( $propName )) &&
                        ( self::UID == substr( $propName, -3 ))) {
                        if( false !== ( $content = $component->getRecurrenceid())) {
                            $content = $component->getUid();
                        }
                    }
                    elseif(( self::GEOLOCATION == $propName ) &&
                           ( ! property_exists( $component, strtolower( self::GEO )) ||
                           ( false === ( $content = $component->getGeoLocation())))) {
                        continue;
                    }
                    else {
                        $method = parent::getGetMethodName( $propName );
                        if( false === ( $content = $component->{$method}())) {
                            continue;
                        }
                    }
                    if(( false === $content ) || empty( $content )) {
                        continue;
                    }
                    elseif( is_array( $content )) {
                        if( isset( $content[Util::$LCYEAR] )) {
                            $key = DateTimeFactory::getYMDString( $content );
                            if( ! isset( $output[$key] )) {
                                $output[$key] = 1;
                            }
                            else {
                                $output[$key] += 1;
                            }
                        }
                        else {
                            foreach( $content as $partKey => $partValue ) {
                                if( ! isset( $output[$partKey] )) {
                                    $output[$partKey] = $partValue;
                                }
                                else {
                                    $output[$partKey] += $partValue;
                                }
                            }
                        }
                    } // end elseif( is_array( $content )) {
                    elseif( ! isset( $output[$content] )) {
                        $output[$content] = 1;
                    }
                    else {
                        $output[$content] += 1;
                    }
                } // end foreach( $this->components as $cix => $component)
                if( ! empty( $output )) {
                    ksort( $output );
                }
                return $output;
                break;
            case self::CALSCALE:
                return $this->getCalscale();
                break;
            case self::METHOD:
                return $this->getMethod();
                break;
            case self::PRODID:
                return $this->getProdid();
                break;
            case self::VERSION:
                return $this->getVersion();
                break;
            default:
                break;
        } // end switch
        return false; // not found ??
    }

    /**
     * General Vcalendar set property method
     *
     * @param mixed $args variable number of function arguments,
     *                    first argument is ALWAYS component name,
     *                    second ALWAYS component value!
     * @return mixed array|string|bool
     * @deprecated in favor of properties set method
     * @since  2.27.1 - 2018-12-16
     */
    public function setProperty( $args ) {
        $numargs = func_num_args();
        if( 1 > $numargs ) {
            return false;
        }
        $arglist = func_get_args();
        switch( strtoupper( $arglist[0] )) {
            case self::CALSCALE:
                return $this->setCalscale( $arglist[1] );
            case self::METHOD:
                return $this->setMethod( $arglist[1] );
            case self::VERSION:
                return $this->setVersion( $arglist[1] );
            default:
                return $this->setXprop(
                    $arglist[0],
                    isset( $arglist[1] ) ? $arglist[1] : null,
                    isset( $arglist[2] ) ? $arglist[2] : null
                );
        }
    }

    /**
     * Add calendar component to Vcalendar
     *
     * alias to setComponent
     *
     * @param CalendarComponent $component
     * @return static
     * @throws InvalidArgumentException
     * @deprecated in favor of setComponent
     * @since  2.27.1 - 2018-12-21
     *  since  1.x.x - 2007-04-24
     */
    public function addComponent( CalendarComponent $component ) {
        $this->setComponent( $component );
        return $this;
    }

    /**
     * Return clone of calendar component
     *
     * @param mixed $arg1 ordno/component type/component uid
     * @param mixed $arg2 ordno if arg1 = component type
     * @return mixed CalendarComponent|bool (false on error)
     * @since  2.27.14 - 2019-02-20
     * @todo throw InvalidArgumentException on unknown component
     */
    public function getComponent( $arg1 = null, $arg2 = null ) {
        $index = $argType = null;
        switch( true ) {
            case ( is_null( $arg1 )) : // first or next in component chain
                $argType = self::$INDEX;
                if( isset( $this->compix[self::$INDEX] )) {
                    $this->compix[self::$INDEX] = $this->compix[self::$INDEX] + 1;
                }
                else {
                    $this->compix[self::$INDEX] = 1;
                }
                $index = $this->compix[self::$INDEX];
                break;
            case ( is_array( $arg1 )) : // [ *[propertyName => propertyValue] ]
                $arg2 = implode( Util::$MINUS, array_keys( $arg1 ));
                if( isset( $this->compix[$arg2] )) {
                    $this->compix[$arg2] = $this->compix[$arg2] + 1;
                }
                else {
                    $this->compix[$arg2] = 1;
                }
                $index = $this->compix[$arg2];
                break;
            case ( ctype_digit((string) $arg1 )) : // specific component in chain
                $argType      = self::$INDEX;
                $index        = (int) $arg1;
                $this->compix = [];
                break;
            case ( Util::isCompInList( $arg1, self::$MCOMPS ) &&
                ( 0 != strcasecmp( $arg1, self::VALARM ))) : // object class name
                unset( $this->compix[self::$INDEX] );
                $argType = strtolower( $arg1 );
                if( is_null( $arg2 )) {
                    if( isset( $this->compix[$argType] )) {
                        $this->compix[$argType] = $this->compix[$argType] + 1;
                    }
                    else {
                        $this->compix[$argType] = 1;
                    }
                    $index = $this->compix[$argType];
                }
                elseif( isset( $arg2 ) && ctype_digit((string) $arg2 )) {
                    $index = (int) $arg2;
                }
                break;
            case ( is_string( $arg1 )) : // assume UID as 1st argument
                if( is_null( $arg2 )) {
                    if( isset( $this->compix[$arg1] )) {
                        $this->compix[$arg1] = $this->compix[$arg1] + 1;
                    }
                    else {
                        $this->compix[$arg1] = 1;
                    }
                    $index = $this->compix[$arg1];
                }
                elseif( isset( $arg2 ) && ctype_digit((string) $arg2 )) {
                    $index = (int) $arg2;
                }
                break;
        } // end switch( true )
        if( isset( $index )) {
            $index -= 1;
        }
        $cKeys = array_keys( $this->components );
        if( ! empty( $index ) && ( $index > end( $cKeys ))) {
            return false;
        }
        $cix1gC = 0;
        foreach( $cKeys as $cix ) {
            if( empty( $this->components[$cix] )) {
                continue;
            }
            if(( self::$INDEX == $argType ) && ( $index == $cix )) {
                return clone $this->components[$cix];
            }
            elseif( 0 == strcasecmp( $argType, $this->components[$cix]->getCompType())) {
                if( $index == $cix1gC ) {
                    return clone $this->components[$cix];
                }
                $cix1gC++;
            }
            elseif( is_array( $arg1 )) { // [ *[propertyName => propertyValue] ]
                if( self::isFoundInCompsProps( $this->components[$cix], $arg1 )) {
                    if( $index == $cix1gC ) {
                        return clone $this->components[$cix];
                    }
                    $cix1gC++;
                }
            } // end elseif( is_array( $arg1 )) { // [ *[propertyName => propertyValue] ]
            elseif( ! $argType &&
                ( $arg1 == $this->components[$cix]->getUid())) {
                if( $index == $cix1gC ) {
                    return clone $this->components[$cix];
                }
                $cix1gC++;
            }
        } // end foreach( $cKeys as $cix )
        /* not found.. . */
        $this->compix = [];
        return false;
    }

    /**
     * Return bool true on argList values found in any component property
     *
     * @param CalendarComponent $component
     * @param array             $argList
     * @return bool
     * @access private
     * @static
     * @since  2.27.14 - 2019-02-20
     */
    private static function isFoundInCompsProps( CalendarComponent $component, array $argList ) {
        static $T = 'T';
        foreach( $argList as $propName => $propValue ) {
            if( ! Util::isPropInList( $propName, self::$DATEPROPS ) &&
                ! Util::isPropInList( $propName, Vcalendar::$OTHERPROPS )) {
                continue;
            }
            if( ! property_exists( $component, parent::getInternalPropName( $propName ))) {
                continue;
            }
            if( Util::isPropInList( $propName, self::$MPROPS1 )) { // multiple occurrence
                $propValues = [];
                $component->getProperties( $propName, $propValues );
                if( in_array( $propValue, array_keys( $propValues ))) {
                    return true;
                }
                continue;
            } // end   if(.. .// multiple occurrence
            $method = parent::getGetMethodName( $propName );
            if( false === ( $value = $component->{$method}())) { // single occurrence
                continue; // missing/empty property
            }
            if( self::SUMMARY == $propName ) { // exists in (any case)
                if( false !== stripos( $value, $propValue )) {
                    return true;
                }
                continue;
            }
            if( Util::isPropInList( $propName, self::$DATEPROPS )) {
                $valueDate = DateTimeFactory::getYMDString( $value );
                if( 8 < strlen( $propValue )) {
                    if( isset( $value[Util::$LCHOUR] )) {
                        if( $T == substr( $propValue, 8, 1 )) {
                            $propValue = str_replace( $T, null, $propValue );
                        }
                        $valueDate .= DateTimeFactory::getHisString( $value );
                    }
                    else {
                        $propValue = substr( $propValue, 0, 8 );
                    }
                }
                if( $propValue == $valueDate ) {
                    return true;
                }
                continue;
            }
            elseif( ! is_array( $value )) {
                $value = [ $value ];
            }
            foreach( $value as $part ) {
                $part = ( false !== strpos( $part, Util::$COMMA )) ? explode( Util::$COMMA, $part ) : [ $part ];
                foreach( $part as $subPart ) {
                    if( $propValue == $subPart ) {
                        return true;
                    }
                }
            } // end foreach( $value as $part )
        } // end  foreach( $arg1 as $propName => $propValue )
        return false;
    }

    /**
     * Return new calendar component, included in calendar or component
     *
     * @param string $compType component type
     * @return CalendarComponent
     * @throws InvalidArgumentException
     * @deprecated in favor of new<component> methods
     * @since  2.26 - 2018-11-10
     */
    public function newComponent( $compType ) {
        static $ERRMSG = 'Unknown component %s';
        switch( ucfirst( strtolower( $compType ))) {
            case self::VEVENT :
                return $this->newVevent();
                break;
            case self::VTODO :
                return $this->newVtodo();
                break;
            case self::VJOURNAL :
                return $this->newVjournal();
                break;
            case self::VFREEBUSY :
                return $this->newVfreebusy();
                break;
            case self::VTIMEZONE :
                return $this->newVtimezone();
                break;
            default:
                break;
        }
        throw new InvalidArgumentException( sprintf( $ERRMSG, $compType ));
    }
    
    /**
     * Return Vevent object instance
     *
     * @return Vevent
     * @since  2.27.14 - 2018-02-19
     */
    public function newVevent() {
        $comp = new Vevent( $this->getConfig());
        $comp->getDtstamp();
        $comp->getUid();
        $ix = $this->getNextComponentIndex();
        $this->components[$ix] = $comp;
        return $comp;
    }

    /**
     * Return Vtodo object instance
     *
     * @return Vtodo
     * @since  2.27.14 - 2018-02-19
     */
    public function newVtodo() {
        $comp = new Vtodo( $this->getConfig());
        $comp->getDtstamp();
        $comp->getUid();
        $ix = $this->getNextComponentIndex();
        $this->components[$ix] = $comp;
        return $comp;
    }

    /**
     * Return Vjournal object instance
     *
     * @return Vjournal
     * @since  2.27.14 - 2018-02-19
     */
    public function newVjournal() {
        $comp = new Vjournal( $this->getConfig());
        $comp->getDtstamp();
        $comp->getUid();
        $ix = $this->getNextComponentIndex();
        $this->components[$ix] = $comp;
        return $comp;
    }

    /**
     * Return Vfreebusy object instance
     *
     * @return Vfreebusy
     * @since  2.27.14 - 2018-02-19
     */
    public function newVfreebusy() {
        $comp = new Vfreebusy( $this->getConfig());
        $comp->getDtstamp();
        $comp->getUid();
        $ix = $this->getNextComponentIndex();
        $this->components[$ix] = $comp;
        return $comp;
    }

    /**
     * Return Vtimezone object instance
     *
     * @return Vtimezone
     * @since  2.27.2 - 2018-12-21
     */
    public function newVtimezone() {
        array_unshift( $this->components, new Vtimezone( $this->getConfig()));
        return $this->components[0];
    }

    /**
     * Replace calendar component in Vcalendar
     *
     * @param CalendarComponent $component
     * @return static
     * @throws InvalidArgumentException
     * @since  2.27.3 - 2018-12-28
     */
    public function replaceComponent( CalendarComponent $component ) {
        static $ERRMSG1 = 'Invalid component type \'%s\'';
        static $ERRMSG2 = 'Vtimezone with tzid \'%s\' not found, found \'%s\'';
        if( Util::isCompInList( $component->getCompType(), self::$VCOMPS )) {
            return $this->setComponent( $component, $component->getUid());
        }
        if(( self::VTIMEZONE != $component->getCompType()) ||
            ( false === ( $tzId = $component->getTzid()))) {
            throw new InvalidArgumentException( sprintf( $ERRMSG1, $component->getCompType()));
        }
        $found = [];
        foreach( $this->components as $cix => $comp ) {
            if( self::VTIMEZONE != $component->getCompType()) {
                continue;
            }
            $foundTxid = $comp->getTzid();
            if( $tzId == $foundTxid ) {
                $component->compix      = [];
                $this->components[$cix] = $component;
                return $this;
            }
            $found[] = $foundTxid;
        }
        throw new InvalidArgumentException(
            sprintf(
                $ERRMSG2,
                $component->getCompType(),
                implode( Util::$COMMA, $found )
            )
        );
    }

    /**
     * Return selected components from calendar on date or selectOption basis
     *
     * DTSTART MUST be set for every component.
     * No date check.
     *
     * @param mixed $startY                  (int) start Year,  default current Year
     *                                       ALT. (obj) start date (datetime)
     *                                       ALT. array selecOptions ( *[ <propName> => <uniqueValue> ] )
     * @param mixed $startM                  (int) start Month, default current Month
     *                                       ALT. (obj) end date (datetime)
     * @param int   $startD                  start Day,   default current Day
     * @param int   $endY                    end   Year,  default $startY
     * @param int   $endM                    end   Month, default $startM
     * @param int   $endD                    end   Day,   default $startD
     * @param mixed $cType                   calendar component type(-s), default false=all else string/array type(-s)
     * @param bool  $flat                    false (default) => output : array[Year][Month][Day][]
     *                                       true            => output : array[] (ignores split)
     * @param bool  $any                     true (default) - select component(-s) that occurs within period
     *                                       false          - only component(-s) that starts within period
     * @param bool  $split                   true (default) - one component copy every DAY it occurs during the
     *                                       period (implies flat=false)
     *                                       false          - one occurance of component only in output array
     * @return mixed   array on success, bool false on error
     * @throws Exception
     * @since  2.26 - 2018-11-10
     */
    public function selectComponents(
        $startY = null,
        $startM = null,
        $startD = null,
        $endY   = null,
        $endM   = null,
        $endD   = null,
        $cType  = null,
        $flat   = null,
        $any    = null,
        $split  = null
    ) {
        try {
            return SelectFactory::selectComponents(
                $this,
                $startY, $startM, $startD, $endY, $endM, $endD,
                $cType, $flat, $any, $split
            );
        }
        catch( Exception $e ) {
            throw $e;
        }
    }

    /**
     * Sort iCal compoments
     *
     * Ascending sort on properties (if exist) x-current-dtstart, dtstart,
     * x-current-dtend, dtend, x-current-due, due, duration, created, dtstamp, uid if called without arguments,
     * otherwise sorting on specific (argument) property values
     *
     * @param string $sortArg
     * @return static
     * @since  2.27.3 - 2018-12-28
     */
    public function sort( $sortArg = null ) {
        static $SORTER = [ 'Kigkonsult\Icalcreator\Util\SortFactory', 'cmpfcn' ];
        if( 2 > $this->countComponents()) {
            return $this;
        }
        if( ! is_null( $sortArg )) {
            $sortArg = strtoupper( $sortArg );
            if( ! Util::isPropInList( $sortArg, Vcalendar::$OTHERPROPS ) &&
                ( self::DTSTAMP != $sortArg )) {
                $sortArg = null;
            }
        }
        foreach( $this->components as $cix => $component ) {
            SortFactory::setSortArgs( $this->components[$cix], $sortArg );
        }
        usort( $this->components, $SORTER );
        return $this;
    }

    /**
     * Parse iCal text/file into Vcalendar, components, properties and parameters
     *
     * @param mixed    $unparsedtext strict rfc2445 formatted, single property string or array of property strings
     * @param resource $context      PHP resource context
     * @return static
     * @throws InvalidArgumentException
     * @throws UnexpectedValueException
     * @since  2.28.2  2019-08-29
     */
    public function parse( $unparsedtext = false, $context = null ) {
        static $ERR1            = 'No file given';
        static $ERR2            = 'File %s is no file';
        static $ERR3            = 'File %s not readable';
        static $ERR45           = 'Unknown #%d error on read file %s';
        static $ERR10           = 'Only %d rows in ical content :%s';
        static $ERR20           = 'Ical content not in sync (row %d) %s';
        static $NLCHARS         = '\n';
        static $BEGIN_VCALENDAR = 'BEGIN:VCALENDAR';
        static $END_VCALENDAR   = 'END:VCALENDAR';
        static $ENDSHORTS       = [ 'END:VE', 'END:VF', 'END:VJ', 'END:VT' ];
        static $BEGIN_VEVENT    = 'BEGIN:VEVENT';
        static $BEGIN_VFREEBUSY = 'BEGIN:VFREEBUSY';
        static $BEGIN_VJOURNAL  = 'BEGIN:VJOURNAL';
        static $BEGIN_VTODO     = 'BEGIN:VTODO';
        static $BEGIN_VTIMEZONE = 'BEGIN:VTIMEZONE';
        $arrParse = false;
        if( empty( $unparsedtext )) {
            /* directory+filename is set previously
               via setConfig url or directory+filename  */
            if( false === ( $file = $this->getConfig( self::URL ))) {
                $file = $this->getConfig( self::DIRFILE );
                if( false === $file ) {
                    /* err 1 */
                    throw new InvalidArgumentException( $ERR1 );
                }
                if( ! is_file( $file )) {
                    /* err 2 */
                    throw new InvalidArgumentException( sprintf( $ERR2, $file ));
                }
                if( ! is_readable( $file )) {
                    /* err 3 */
                    throw new InvalidArgumentException( sprintf( $ERR3, $file ));
                }
            }
            if( ! empty( $context ) && filter_var( $file, FILTER_VALIDATE_URL )) {
                If( false === ( $rows = file_get_contents( $file, false, $context ))) {
                    /* err 6 */
                    throw new InvalidArgumentException( sprintf( $ERR45, 1, $file ));
                }
            }
            elseif( false === ( $rows = file_get_contents( $file ))) {
                /* err 5 */
                throw new InvalidArgumentException( sprintf( $ERR45, 2, $file ));
            }
        } // end if( empty( $unparsedtext ))
        elseif( is_array( $unparsedtext )) {
            $rows     = implode( $NLCHARS . Util::$CRLF, $unparsedtext );
            $arrParse = true;
        }
        else { // string
            $rows = $unparsedtext;
        }
        /* fix line folding */
        $rows = StringFactory::convEolChar( $rows );
        if( $arrParse ) {
            foreach( $rows as $lix => $row ) {
                $rows[$lix] = StringFactory::trimTrailNL( $row );
            }
        }
        /* skip leading (empty/invalid) lines
           (and remove leading BOM chars etc) */
        foreach( $rows as $lix => $row ) {
            if( false !== stripos( $row, $BEGIN_VCALENDAR )) {
                $rows[$lix] = $BEGIN_VCALENDAR;
                break;
            }
            unset( $rows[$lix] );
        }
        $cnt = count( $rows );
        if( 3 > $cnt ) { /* err 10 */
            throw new UnexpectedValueException(
                sprintf( $ERR10, $cnt, PHP_EOL . implode( PHP_EOL, $rows ))
            );
        }
        /* skip trailing empty lines and ensure an end row */
        $lix = array_keys( $rows );
        $lix = end( $lix );
        while( 3 < $lix ) {
            $tst = trim( $rows[$lix] );
            if(( $NLCHARS == $tst ) || empty( $tst )) {
                unset( $rows[$lix] );
                $lix--;
                continue;
            }
            if( false === stripos( $rows[$lix], $END_VCALENDAR )) {
                $rows[] = $END_VCALENDAR;
            }
            else {
                $rows[$lix] = $END_VCALENDAR;
            }
            break;
        }
        $comp    = $this;
        $calSync = $compSync = 0;
        /* identify components and update unparsed data for components */
        foreach( $rows as $lix => $row ) {
            switch( true ) {
                case ( 0 == strcasecmp( $BEGIN_VCALENDAR, substr( $row, 0, 15 ))) :
                    $calSync++;
                    break;
                case ( 0 == strcasecmp( $END_VCALENDAR, substr( $row, 0, 13 ))) :
                    $calSync  -= 1;
                    if( 0 != $calSync ) {  /* err 20 */
                        throw new UnexpectedValueException(
                            sprintf( $ERR20, $lix, PHP_EOL . implode( PHP_EOL, $rows ))
                        );
                    }
                    break 2;
                case ( in_array( strtoupper( substr( $row, 0, 6 )), $ENDSHORTS )) :
                    $compSync  -= 1;
                    break;
                case ( 0 == strcasecmp( $BEGIN_VEVENT, substr( $row, 0, 12 ))) :
                    $comp      = $this->newVevent();
                    $compSync += 1;
                    break;
                case ( 0 == strcasecmp( $BEGIN_VFREEBUSY, substr( $row, 0, 15 ))) :
                    $comp      = $this->newVfreebusy();
                    $compSync += 1;
                    break;
                case ( 0 == strcasecmp( $BEGIN_VJOURNAL, substr( $row, 0, 14 ))) :
                    $comp      = $this->newVjournal();
                    $compSync += 1;
                    break;
                case ( 0 == strcasecmp( $BEGIN_VTODO, substr( $row, 0, 11 ))) :
                    $comp      = $this->newVtodo();
                    $compSync += 1;
                    break;
                case ( 0 == strcasecmp( $BEGIN_VTIMEZONE, substr( $row, 0, 15 ))) :
                    $comp      = $this->newVtimezone();
                    $compSync += 1;
                    break;
                default : /* update component with unparsed data */
                    $comp->unparsed[] = $row;
                    break;
            } // switch( true )
        } // end foreach( $rows as $lix => $row )
        $this->parseCalendarData();
        if( empty( $this->countComponents())) {
            return $this;
        }
        /* parse Components */
        foreach( array_keys( $this->components ) as $ckey ) {
            if( ! empty( $this->components[$ckey] ) &&
                ! empty( $this->components[$ckey]->unparsed )) {
                $this->components[$ckey]->parse();
            }
        }
        return $this;
    }

    /**
     * Parse calendar data
     *
     * @throws UnexpectedValueException
     * @access private
     * @since  2.27.21 - 2019-06-06
     */
    private function parseCalendarData() {
        static $BEGIN     = 'BEGIN:';
        static $ERR       = 'Unknown ical component (row %d) %s';
        static $CALPROPS  = [
            self::CALSCALE,
            self::METHOD,
            self::PRODID,
            self::VERSION,
        ];
        static $TRIMCHARS = "\x00..\x1F";
        if( ! isset( $this->unparsed ) ||
            ! is_array( $this->unparsed ) ||
            ( 1 > count( $this->unparsed ))) {
            return;
        }
            /* concatenate property values spread over several rows */
        $rows = StringFactory::concatRows( $this->unparsed );
        foreach( $rows as $lix => $row ) {
            if( 0 == strcasecmp( $BEGIN, substr( $row, 0, 6 ))) {
                throw new UnexpectedValueException(
                    sprintf( $ERR, $lix, PHP_EOL . implode( PHP_EOL, $rows ))
                );
            }
            /* split property name  and  opt.params and value */
            list( $propName, $row ) = StringFactory::getPropName( $row );
            switch( true ) {
                case ( StringFactory::isXprefixed( $propName )) :
                    // accept X-properties
                    break;
                case ( Util::isPropInList( $propName, [ self::PRODID, self::VERSION ] )) :
                    // ignore version/prodid properties
                    continue 2;
                    break;
                case ( ! Util::isPropInList( $propName, $CALPROPS )) :
                    // skip non standard property names
                    continue 2;
                    break;
            } // end switch
            /* separate attributes from value */
            list( $value, $propAttr ) = StringFactory::splitContent( $row );
            /* update Property */
            $value = StringFactory::strunrep( rtrim( $value, $TRIMCHARS ));
            if( StringFactory::isXprefixed( $propName )) {
                $this->setXprop( $propName, $value, $propAttr );
                continue;
            }
            $method = parent::getSetMethodName( $propName );
            $this->{$method}( $value, $propAttr );
        } // end foreach
        unset( $this->unparsed );
    }

    /**
     * Return static with (replaced) populated Vtimezone component
     *
     * @param string        $timezone valid timezone acceptable by PHP5 DateTimeZone
     * @param array         $xProp    *[x-propName => x-propValue]
     * @param DateTime|int  $start    .. or unix timestamp
     * @param DateTime|int  $end      .. or unix timestamp
     * @return Vcalendar
     * @throws Exception
     * @throws InvalidArgumentException;
     * @since  2.27.15 - 2019-03-10
     */
    public function vtimezonePopulate(
        $timezone = null,
        $xProp    = [],
        $start    = null,
        $end      = null
    ) {
        return Vtimezone::populate( $this, $timezone, $xProp, $start, $end );
    }

    /**
     * Return formatted output for calendar object instance
     *
     * @return string
     * @since  2.21.07 - 2015-03-31
     */
    public function createCalendar() {
        static $BEGIN_VCALENDAR = "BEGIN:VCALENDAR";
        static $END_VCALENDAR   = "END:VCALENDAR";
        $calendar  = $BEGIN_VCALENDAR . Util::$CRLF;
        $calendar .= $this->createVersion();
        $calendar .= $this->createProdid();
        $calendar .= $this->createCalscale();
        $calendar .= $this->createMethod();
        $calendar .= $this->createXprop();
        $config    = $this->getConfig();
        $this->reset();
        foreach( array_keys( $this->components ) as $cix ) {
            if( ! empty( $this->components[$cix] )) {
                $this->components[$cix]->setConfig( $config, false, true );
                $calendar .= $this->components[$cix]->createComponent();
            }
        }
        return $calendar . $END_VCALENDAR . Util::$CRLF;
    }

    /**
     * Save calendar content in a file
     *
     * @return bool true on success, false on error
     * @deprecated   subject of removal i future versions
     * @since  2.27.2 - 2018-12-21
     */
    public function saveCalendar() {
        $output = $this->createCalendar();
        if( false === ( $dirFile = $this->getConfig( self::URL ))) {
            $dirFile = $this->getConfig( self::DIRFILE );
        }
        return ( false === file_put_contents( $dirFile, $output, LOCK_EX )) ? false : true;
    }

    /**
     * Return created, updated and/or parsed calendar,
     * sending a HTTP redirect header.
     *
     * @param bool $utf8Encode
     * @param bool $gzip
     * @param bool $cdType true : Content-Disposition: attachment... (default), false : ...inline...
     * @return bool true on success, false on error
     * @deprecated   subject of removal i future versions
     * @since  2.27.2 - 2018-12-21
     */
    public function returnCalendar( $utf8Encode = false, $gzip = false, $cdType = true ) {
        return HttpFactory::returnCalendar( $this, $utf8Encode, $gzip, $cdType );
    }

    /**
     * If recent version of calendar file exists (default one hour), an HTTP redirect header is sent
     * else false is returned.
     *
     * @param int  $timeout default 3600 sec
     * @param bool $cdType  true : Content-Disposition: attachment... (default), false : ...inline...
     * @return bool true on success, false on error
     * @deprecated   subject of removal i future versions
     * @since  2.27.2 - 2018-12-21
     */
    public function useCachedCalendar( $timeout = 3600, $cdType = true ) {
        return HttpFactory::useCachedCalendar( $this, $timeout, $cdType );
    }
}
