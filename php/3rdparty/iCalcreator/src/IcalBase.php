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

use Kigkonsult\Icalcreator\Util\Util;
use Kigkonsult\Icalcreator\Util\HttpFactory;
use Kigkonsult\Icalcreator\Util\ParameterFactory;
use InvalidArgumentException;

use function define;
use function defined;
use function array_change_key_case;
use function array_filter;
use function array_keys;
use function array_slice;
use function count;
use function ctype_digit;
use function get_object_vars;
use function is_array;
use function is_null;
use function is_object;
use function key;
use function ksort;
use function microtime;
use function property_exists;
use function sprintf;
use function strtolower;
use function strtoupper;
use function trim;
use function ucfirst;

/**
 *         Do NOT alter or remove the constant!!
 */
if( ! defined( 'ICALCREATOR_VERSION' )) {
    define( 'ICALCREATOR_VERSION', 'iCalcreator 2.28.2' );
}

/**
 * iCalcreator base class
 *
 * Properties and methods shared by Vcalendar and CalendarComponents
 *
 * @author Kjell-Inge Gustafsson, kigkonsult <ical@kigkonsult.se>
 * @since  2.27.20 - 2019-05-20
 */
abstract class IcalBase implements IcalInterface
{
    use Traits\X_PROPtrait;

    /**
     * @var string
     * @access protected
     * @static
     */
    protected static $INDEX  = 'INDEX';
    protected static $YMDHIS = 'YmdHis';
    protected static $DOTICS = '.ics';
    protected static $BS     = '\\';

    /**
     * @var array  iCal V*-component collection
     * @static
     * @usedby IcalBase+Vcalendar+SelectFactory
     */
    public static $VCOMPS   = [
        Vcalendar::VEVENT,
        Vcalendar::VTODO,
        Vcalendar::VJOURNAL,
        Vcalendar::VFREEBUSY
    ];

    /**
     * @var array  iCal timezone component collection
     * @static
     * @usedby DTSTARTtrait+RexdateFactory
     */
    public static $TZCOMPS  = [
        Vcalendar::VTIMEZONE,
        Vcalendar::STANDARD,
        Vcalendar::DAYLIGHT
    ];

    /**
     * @var array  iCal component collection
     * @access protected
     * @static
     */
    protected static $MCOMPS = [
        Vcalendar::VEVENT,
        Vcalendar::VTODO,
        Vcalendar::VJOURNAL,
        Vcalendar::VFREEBUSY,
        Vcalendar::VALARM,
        Vcalendar::VTIMEZONE
    ];

    /**
     * @var array  iCal sub-component collection
     * @access protected
     * @static
     * @usedby CalendarComponent+IcalBase+DTSTAMPtrait
     */
    protected static $SUBCOMPS = [
        Vcalendar::VALARM,
        Vcalendar::VTIMEZONE,
        Vcalendar::STANDARD,
        Vcalendar::DAYLIGHT
    ];

    /**
     * @var array  iCal component multiple property sub-collection
     * @static
     * @usedby CalendarComponent + Vcalendar + SelectFactory + SortFactory
     */
    public static $MPROPS1    = [
        Vcalendar::ATTENDEE, Vcalendar::CATEGORIES, Vcalendar::CONTACT,
        Vcalendar::RELATED_TO, Vcalendar::RESOURCES,
    ];

    /**
     * @var array  iCal component multiple property collection
     * @access protected
     * @static
     * @usedby CalendarComponent(deprecated) + IcalBase
     */
    protected static $MPROPS2    = [
        Vcalendar::ATTACH, Vcalendar::ATTENDEE, Vcalendar::CATEGORIES,
        Vcalendar::COMMENT, Vcalendar::CONTACT, Vcalendar::DESCRIPTION,
        Vcalendar::EXDATE, Vcalendar::EXRULE, Vcalendar::FREEBUSY, Vcalendar::RDATE,
        Vcalendar::RELATED_TO, Vcalendar::RESOURCES, Vcalendar::RRULE,
        Vcalendar::REQUEST_STATUS, Vcalendar::TZNAME, Vcalendar::X_PROP,
    ];

    /**
     * @var array  iCal component misc. property collection
     * @static
     * @usedby Vcalendar + SelectFactory
     */
    public static $OTHERPROPS = [
        Vcalendar::ATTENDEE, Vcalendar::CATEGORIES, Vcalendar::CONTACT, Vcalendar::LOCATION,
        Vcalendar::ORGANIZER, Vcalendar::PRIORITY, Vcalendar::RELATED_TO, Vcalendar::RESOURCES,
        Vcalendar::STATUS, Vcalendar::SUMMARY, Vcalendar::UID, Vcalendar::URL,
    ];

    /**
     * @var array container for sub-components
     * @access protected
     */
    protected $components = [];

    /**
     * @var array $unparsed calendar/components in 'raw' text...
     * @access protected
     */
    protected $unparsed = null;

    /**
     * @var array $config configuration with defaults
     * @access protected
     */
    protected $config = [
        self::ALLOWEMPTY => true,
        self::DELIMITER  => DIRECTORY_SEPARATOR,
        self::DIRECTORY  => '.'
    ];

    /**
     * @var string component type
     * @access protected
     */
    protected $compType = null;

    /**
     * @var array component index
     * @access protected
     */
    protected $compix = [];

    /**
     * @var array get multi property index
     * @access protected
     */
    protected $propIx = [];

    /**
     * @var array delete multi property index
     * @access protected
     */
    protected $propDelIx = [];

    /**
     * __clone method
     *
     * @link https://php.net/manual/en/language.oop5.cloning.php#116329
     * @since  2.26 - 2018-11-10
     */
    public function __clone() {
        $object_vars = get_object_vars( $this );
        foreach( $object_vars as $attr_name => $attr_value ) {
            if( is_object( $this->$attr_name )) {
                $this->$attr_name = clone $this->$attr_name;
            }
            else if( is_array( $this->$attr_name )) {
                // Note: This copies only one dimension arrays
                foreach( $this->$attr_name as & $attr_array_value ) {
                    if( is_object( $attr_array_value )) {
                        $attr_array_value = clone $attr_array_value;
                    }
                    unset( $attr_array_value );
                }
            }
        }
        $this->compix    = [];
        $this->propIx    = [];
        $this->propDelIx = [];
    }

    /**
     * Reset internal counters
     *
     * @return static
     * @since  2.27.14 - 2019-03-11
     */
    public function reset() {
        $this->compix = [];
        return $this;
    }

    /**
     * Return component type
     *
     * @return string
     * @static
     * @since  2.27.2 - 2018-12-21
     */
    public function getCompType() {
        return $this->compType;
    }

    /**
     * Remove Vcalendar/component config key value
     *
     * @param string $key
     * @return static
     * @since  2.27.14 - 2019-02-04
     */
    public function deleteConfig( $key ) {
        $key = strtoupper( $key );
        if( isset( $this->config[$key] )) {
            unset( $this->config[$key] );
        }
        return $this;
    }

    /**
     * Return Vcalendar/component config value, false on not found
     *
     * @param mixed $config
     * @return mixed   bool false on not found or empty
     * @since  2.27.14 - 2019-02-20
     */
    public function getConfig( $config = null ) {
        static $LCORDNO = 'ordno';
        static $LCTYPE  = 'type';
        static $LCUID   = 'uid';
        static $LCPROPS = 'props';
        static $LCSUB   = 'sub';
        if( is_null( $config )) {
            $output                      = [];
            $output[self::ALLOWEMPTY]    = $this->getConfig( self::ALLOWEMPTY );
            if( false !== ( $cfg = $this->getConfig( self::LANGUAGE ))) {
                $output[self::LANGUAGE]  = $cfg;
            }
            $output[self::UNIQUE_ID]     = $this->getConfig( self::UNIQUE_ID );
            if( ! property_exists( $this, self::getInternalPropName( self::PRODID ))) {
                $output[self::DELIMITER] = $this->getConfig( self::DELIMITER );
                $output[self::DIRECTORY] = $this->getConfig( self::DIRECTORY );
                $output[self::FILENAME]  = $this->getConfig( self::FILENAME );
                $output[self::DIRFILE]   = $this->getConfig( self::DIRFILE );
                $output[self::FILESIZE]  = $this->getConfig( self::FILESIZE );
                if( false !== ( $cfg = $this->getConfig( self::URL ))) {
                    $output[self::URL]   = $cfg;
                }
            }
            return $output;
        }
        switch( strtoupper( $config )) {
            case self::ALLOWEMPTY:
                if( ! isset( $this->config[self::ALLOWEMPTY] )) { // default
                    $this->config[self::ALLOWEMPTY] = true;
                }
                return $this->config[self::ALLOWEMPTY];
                break;
            case self::UNIQUE_ID:
                if( isset( $this->config[self::UNIQUE_ID] )) {
                    return $this->config[self::UNIQUE_ID];
                }
                break;
            case self::LANGUAGE: // get language for calendar component as defined in [RFC 1766]
                if( isset( $this->config[self::LANGUAGE] )) {
                    return $this->config[self::LANGUAGE];
                }
                break;
            case self::DELIMITER :
                if( ! isset( $this->config[self::DELIMITER] )) {  // default
                    $this->config[self::DELIMITER] = DIRECTORY_SEPARATOR;
                }
                return $this->config[self::DELIMITER];
                break;
            case self::DIRECTORY :
                if( ! isset( $this->config[self::DIRECTORY] )) {  // default
                    $this->config[self::DIRECTORY] = Util::$DOT;
                }
                return $this->config[self::DIRECTORY];
                break;
            case self::FILENAME :
                if( ! isset( $this->config[self::FILENAME] )) {
                    $this->config[self::FILENAME] = self::getFakedFilename();
                }
                return $this->config[self::FILENAME];
                break;
            case self::FILESIZE :
                $size = 0;
                if( empty( $this->config[self::URL] )) {
                    $dirFile = $this->getConfig( self::DIRFILE );
                    if( ! is_file( $dirFile ) || ( false === ( $size = filesize( $dirFile )))) {
                        $size = 0;
                    }
                    clearstatcache();
                }
                return $size;
                break;
            case self::DIRFILE :
                return
                    $this->getConfig( self::DIRECTORY ) .
                    $this->getConfig( self::DELIMITER ) .
                    $this->getConfig( self::FILENAME );
                break;
            case self::FILEINFO :
                return [
                    $this->getConfig( self::DIRECTORY ),
                    $this->getConfig( self::FILENAME ),
                    $this->getConfig( self::FILESIZE ),
                ];
                break;
            case self::URL :
                if( ! empty( $this->config[self::URL] )) {
                    return $this->config[self::URL];
                }
                break;
            case self::COMPSINFO:
                $this->compix = [];
                $info = [];
                if( ! empty( $this->components )) {
                    foreach( $this->components as $cix => $component ) {
                        if( empty( $component )) {
                            continue;
                        }
                        $info[$cix][$LCORDNO] = $cix + 1;
                        $info[$cix][$LCTYPE]  = $component->getCompType();
                        if( ! Util::isCompInList( $component->getCompType(), self::$SUBCOMPS )) {
                            $info[$cix][$LCUID] = $component->getUid();
                        }
                        $info[$cix][$LCPROPS] = $component->getConfig( self::PROPINFO );
                        $info[$cix][$LCSUB]   = $component->getConfig( self::COMPSINFO );
                    }
                }
                return $info;
                break;
            case self::PROPINFO:
                return $this->getpropInfo();
                break;
            case self::SETPROPERTYNAMES:
                return array_keys( $this->getConfig( self::PROPINFO ));
                break;
            default :
                break;
        }
        return false;
    }

    /**
     * Return array( propertyName => count )
     *
     * @return array
     * @access protected
     * @since  2.27.11 - 2019-01-03
     */
    protected function getpropInfo() {
        static $PROPNAMES  = [
            self::ACTION, self::ATTACH, self::ATTENDEE, self::CATEGORIES,
            self::KLASS, self::COMMENT, self::COMPLETED, self::CONTACT,
            self::CREATED, self::DESCRIPTION, self::DTEND, self::DTSTAMP,
            self::DTSTART, self::DUE, self::DURATION, self::EXDATE, self::EXRULE,
            self::FREEBUSY, self::GEO, self::LAST_MODIFIED, self::LOCATION,
            self::ORGANIZER, self::PERCENT_COMPLETE, self::PRIORITY,
            self::RECURRENCE_ID, self::RELATED_TO, self::REPEAT,
            self::REQUEST_STATUS, self::RESOURCES, self::RRULE, self::RDATE,
            self::SEQUENCE, self::STATUS, self::SUMMARY, self::TRANSP,
            self::TRIGGER, self::TZNAME, self::TZID, self::TZOFFSETFROM,
            self::TZOFFSETTO, self::TZURL, self::UID, self::URL, self::X_PROP,
        ];
        if( ! Util::isCompInList( $this->getCompType(), self::$SUBCOMPS )) {
            $this->getUid();
            $this->getDtstamp();
        }
        $output = [];
        foreach( $PROPNAMES as $propName ) {
            $propName2 = IcalBase::getInternalPropName( $propName );
            switch( true ) {
                case ( ! property_exists( $this, $propName2 )) :
                    break;
                case ( empty( $this->{$propName2} )) :
                    break;
                case ( self::X_PROP == $propName ) :
                    foreach( array_keys( $this->{$propName2}) as $propName3 ) {
                        $output[$propName3] = 1;
                    }
                    break;
                case ( Util::isPropInList( $propName, Util::$MPROPS2 )) :
                    $output[$propName] = count( $this->{$propName2} );
                    break;
                default :
                    $output[$propName] = 1;
            }
        }
        return $output;
    }

    /**
     * Set Vcalendar/component config
     *
     * @param mixed  $config
     * @param string $value
     * @param bool   $softUpdate
     * @return static
     * @throws InvalidArgumentException
     * @since  2.27.8 - 2019-01-19
     */
    public function setConfig( $config, $value = null, $softUpdate = null ) {
        static $ERRMSG1 = 'Directory \'%s\' does not exist';
        static $ERRMSG2 = 'File \'%s\' NOT readable or writable';
        static $ERRMSG3 = 'Directory \'%s\' NOT readable or writable';
        static $ERRMSG9 = 'Invalid config value %s';
        $isComponent = ( ! property_exists( $this, self::getInternalPropName( self::PRODID )));
        if( is_array( $config )) {
            $config = array_change_key_case( $config, CASE_UPPER );
            if( ! $isComponent && isset( $config[self::DELIMITER] )) {
                $this->setConfig( self::DELIMITER, $config[self::DELIMITER] );
                unset( $config[self::DELIMITER] );
            }
            if( ! $isComponent && isset( $config[self::DIRECTORY] )) {
                $this->setConfig( self::DIRECTORY, $config[self::DIRECTORY] );
                unset( $config[self::DIRECTORY] );
            }
            foreach( $config as $cKey => $cValue ) {
                $this->setConfig( $cKey, $cValue );
            }
            return $this;
        }
        $key    = strtoupper( $config );
        $subCfg = null;
        switch( true ) {
            case ( self::ALLOWEMPTY == $key ) :
                $this->config[self::ALLOWEMPTY] = $value;
                $subCfg = [ self::ALLOWEMPTY => $value ];
                break;
            case ( self::LANGUAGE == $key ) :
                // set language for calendar component as defined in [RFC 1766]
                $value  = trim( $value );
                if( empty( $this->config[self::LANGUAGE] ) || ! $softUpdate ) { // ??
                    $this->config[self::LANGUAGE] = $value;
                }
                if( ! $isComponent ) {
                    $this->makeProdid();
                }
                $subCfg = [ self::LANGUAGE => $value ];
                break;
            case ( self::UNIQUE_ID == $key ) :
                $value  = trim( $value );
                $this->config[self::UNIQUE_ID] = $value;
                if( ! $isComponent ) {
                    $this->makeProdid();
                }
                $subCfg = [ self::UNIQUE_ID => $value ];
                break;
            case ( $isComponent ) :
                break;
            case ( self::DIRFILE == $key ) :
                break;
            case ( self::FILESIZE == $key ) :
                break;
            case ( self::DELIMITER == $key ) :
                $this->config[self::DELIMITER] = $value;
                return $this;
                break;
            case ( self::DIRECTORY == $key ) :
                if( empty( $value ) || ( Util::$DOT == $value )) {
                    break;
                }
                $path = rtrim( trim( $value ));
                switch( true ) {
                    case ( false === ( $value = rtrim( realpath( $path ), $this->config[self::DELIMITER] ))) :
                        throw new InvalidArgumentException( sprintf( $ERRMSG1, $path ));
                        break;
                    case ( ! is_readable( $value ) || ! is_writable( $value )) :
                        throw new InvalidArgumentException( sprintf( $ERRMSG3, $value ));
                        break;
                    default :  /* local directory */
                        $this->config[self::DIRECTORY] = $value;
                        $this->config[self::URL]       = null;
                        break;
                }
                return $this;
                break;
            case ( self::FILENAME == $key ) :
                $value   = trim( $value );
                if( empty( $value ))  {
                    break;
                }
//                $dirFile = $this->config[self::DIRECTORY] . $this->config[self::DELIMITER] . $value;
                $dirFile = $this->getConfig( self::DIRECTORY ) .
                           $this->getConfig( self::DELIMITER ) . $value;
                switch( true ) {
                    case ( file_exists( $dirFile )) :
                        /* local file exists */
                        if( ! is_readable( $dirFile ) && ! is_writable( $dirFile )) {
                            throw new InvalidArgumentException( sprintf( $ERRMSG2, $dirFile ));
                        }
                        clearstatcache();
                        $this->config[self::FILENAME] = $value;
                        break;
                    case ( is_readable( $this->config[self::DIRECTORY] ) ||
                        is_writable( $this->config[self::DIRECTORY] )) :
                        /* read- or writable directory */
                        clearstatcache();
                        $this->config[self::FILENAME] = $value;
                        break;
                    default :
                        throw new InvalidArgumentException( sprintf( $ERRMSG3, $this->config[self::DIRECTORY] ));
                        break;
                }
                return $this;
                break;
            case ( self::URL == $key ) :
                /* remote file - URL */
                HttpFactory::assertUrl( $value );
                $this->config[self::DIRECTORY] = Util::$DOT;
                $this->config[self::URL]       = $value;
                if( self::$DOTICS != strtolower( substr( $value, -4 ))) {
                    unset( $this->config[self::FILENAME] );
                }
                else {
                    $this->config[self::FILENAME] = basename( $value );
                }
                return $this;
                break;
            default:  // any invalid config key.. .
                throw new InvalidArgumentException( sprintf( $ERRMSG9, $config ));
        }
        if( ! empty( $subCfg ) && ! empty( $this->components )) {
            foreach( $subCfg as $cfgkey => $cfgValue ) {
                foreach( $this->components as $cix => $component ) {
                    $this->components[$cix]->setConfig( $cfgkey, $cfgValue, true );
                }
            }
        }
        return $this;
    }

    /**
     * Return faked filename
     *
     * @return string $propName
     * @access protected
     * @static
     * @since  2.27.1 - 2018-12-12
     */
    protected static function getFakedFilename() {
        return date( self::$YMDHIS, intval( microtime( true ))) . self::$DOTICS;
    }

    /**
     * Assert empty value
     *
     * @param mixed  $value
     * @param string $propName
     * @access protected
     * @throws InvalidArgumentException
     * @since  2.27.1 - 2018-12-12
     */
    protected function assertEmptyValue( $value, $propName ) {
        static $ERRMSG = 'Empty %s value not allowed';
        if( empty( $value ) && ! $this->getConfig( self::ALLOWEMPTY )) {
            throw new InvalidArgumentException( sprintf( $ERRMSG, $propName ));
        }
    }

    /**
     * Return index
     *
     * @param array $indexArr
     * @param mixed $propName
     * @param int   $index
     * @return bool   true on success
     * @access protected
     * @static
     * @since  2.27.1 - 2018-12-15
     */
    protected static function getIndex( array & $indexArr, $propName, $index = null ) {
        if( is_null( $index )) {
            $index = ( isset( $indexArr[$propName] )) ? $indexArr[$propName] + 2 : 1;
        }
        $index -= 1;
        $indexArr[$propName] = $index;
        return $index;
    }

    /**
     * Return internal name for property
     *
     * @param string $propName
     * @return string
     * @access protected
     * @static
     * @since  2.27.1 - 2018-12-16
     */
    protected static function getInternalPropName( $propName ) {
        $internalName = strtolower( $propName );
        if( false !== strpos( $internalName, Util::$MINUS )) {
            $internalName = implode( explode( Util::$MINUS, $internalName ));
        }
        return $internalName;
    }

    /**
     * Return method from format and propName
     *
     * @param string $format
     * @param string $propName
     * @return string
     * @access private
     * @static
     * @since  2.27.14 - 2019-02-18
     */
    private static function getMethodName( $format, $propName ) {
        return sprintf( $format, ucfirst( self::getInternalPropName( $propName )));
    }

    /**
     * Return name for property delete-method
     *
     * @param string $propName
     * @return string
     * @static
     * @since  2.27.1 - 2019-01-17
     */
    public static function getCreateMethodName( $propName ) {
        static $FMT = 'create%s';
        return self::getMethodName( $FMT, $propName );
    }

    /**
     * Return name for property delete-method
     *
     * @param string $propName
     * @return string
     * @static
     * @since  2.27.1 - 2018-12-12
     */
    public static function getDeleteMethodName( $propName ) {
        static $FMT = 'delete%s';
        return self::getMethodName( $FMT, $propName );
    }

    /**
     * Return name for property get-method
     *
     * @param string $propName
     * @return string
     * @static
     * @since  2.27.1 - 2018-12-12
     */
    public static function getGetMethodName( $propName ) {
        static $FMT = 'get%s';
        return self::getMethodName( $FMT, $propName );
    }

    /**
     * Return name for property set-method
     *
     * @param string $propName
     * @return string
     * @static
     * @since  2.27.1 - 2018-12-16
     */
    public static function getSetMethodName( $propName ) {
        static $FMT = 'set%s';
        return self::getMethodName( $FMT, $propName );
    }

    /**
     * Recount property propIx, used at consecutive getProperty calls
     *
     * @param array $propArr   component (multi-)property
     * @param int   $propIx getter counter
     * @return bool true
     * @access protected
     * @static
     * @since  2.27.1 - 2018-12-15
     */
    protected static function recountMvalPropix( array $propArr, & $propIx ) {
        if( empty( $propArr )) {
            return false;
        }
        $last = key( array_slice( $propArr, -1, 1, true ));
        while( ! isset( $propArr[$propIx] ) && ( $last > $propIx )) {
            $propIx++;
        }
        return true;
    }

    /**
     * Check index and set (an indexed) content in a multiple value array
     *
     * @param array $valArr
     * @param mixed $value
     * @param array $params
     * @param array $defaults
     * @param int   $index
     * @access protected
     * @static
     * @since  2.22.23 - 2017-04-08
     */
    protected static function setMval(
        & $valArr,
        $value,
        $params   = null,
        $defaults = null,
        $index    = null
    ) {
        if( ! is_array( $valArr )) {
            $valArr = [];
        }
        if( empty( $params )) {
            $params = [];
        }
        $params = ParameterFactory::setParams( $params, $defaults );
        if( is_null( $index )) { // i.e. next
            $valArr[] = [
                Util::$LCvalue  => $value,
                Util::$LCparams => $params,
            ];
            return;
        }
        $index = $index - 1;
        if( isset( $valArr[$index] )) { // replace
            $valArr[$index] = [
                Util::$LCvalue  => $value,
                Util::$LCparams => $params,
            ];
            return;
        }
        $valArr[$index] = [
            Util::$LCvalue  => $value,
            Util::$LCparams => $params,
        ];
        ksort( $valArr ); // order
    }

    /**
     * Delete calendar component multiProp property[ix]
     *
     * @param array $multiProp component (multi-)property
     * @param mixed $propName
     * @param int   $propDelIx   specific property in case of multiply occurrence
     * @return bool   true on success
     * @access protected
     * @since  2.27.1 - 2018-12-15
     */
    protected function deletePropertyM( & $multiProp, $propName, $propDelIx = null ) {
        if( empty( $multiProp )) {
            unset( $this->propDelIx[$propName] );
            return false;
        }
        if( false === $propDelIx ) {
            $propDelIx = null; // tidy up, altered default value
        }
        $propDelIx = self::getIndex( $this->propDelIx, $propName, $propDelIx );
        if( isset( $multiProp[$propDelIx] )) {
            unset( $multiProp[$propDelIx] );
        }
        if( empty( $multiProp )) {
            $multiProp = null;
            unset( $this->propDelIx[$propName] );
            return false;
        }
        return true;
    }

    /**
     * Get calendar component multpProp property
     *
     * @param array  $multiProp component (multi-)property
     * @param string $propName
     * @param int    $propIx specific property in case of multiply occurrence
     * @param bool   $inclParam
     * @return bool|array
     * @access protected
     * @since  2.27.1 - 2018-12-15
     */
    protected function getPropertyM( $multiProp, $propName, $propIx = null, $inclParam = false ) {
        if( empty( $multiProp )) {
            unset( $this->propIx[$propName] );
            return false;
        }
        if( false === $propIx ) {
            $propIx = null; // tidy up, altered default value
        }
        $propIx = self::getIndex( $this->propIx, $propName, $propIx );
        if( ! self::recountMvalPropix( $multiProp, $propIx )) {
            unset( $this->propIx[$propName] );
            return false;
        }
        $this->propIx[$propName] = $propIx;
        if( ! isset( $multiProp[$propIx] )) {
            unset( $this->propIx[$propName] );
            return false;
        }
        return ( $inclParam ) ? $multiProp[$propIx] : $multiProp[$propIx][Util::$LCvalue];
    }

    /**
     * Return number of components
     *
     * @return int
     * @since  2.23.5 - 2017-04-13
     */
    public function countComponents() {
        return ( empty( $this->components )) ? 0 : count( $this->components );
    }


    /**
     * Delete calendar subcomponent from component container
     *
     * @param mixed $arg1 ordno / component type / component uid
     * @param mixed $arg2 ordno if arg1 = component type
     * @return bool  true on success, false on not found (last one deleted)
     * @since  2.26.14 - 2019-02-25
     * @todo Exception mgnt on unknown component
     */
    public function deleteComponent( $arg1, $arg2 = false ) {
        if( ! isset( $this->components )) {
            return false;
        }
        $argType = $index = null;
        if( ctype_digit((string) $arg1 )) {
            $argType = self::$INDEX;
            $index   = (int) $arg1 - 1;
        }
        elseif( property_exists( $this, self::getInternalPropName( self::PRODID )) &&
            ( Util::isCompInList( $arg1, self::$MCOMPS ) &&
            ( 0 != strcasecmp( $arg1, self::VALARM )))) {
            $argType = ucfirst( strtolower( $arg1 ));
            $index   = ( ! empty( $arg2 ) && ctype_digit((string) $arg2 )) ? (( int ) $arg2 - 1 ) : 0;
        }
        $cix2dC = 0;
        $remove = false;
        foreach( $this->components as $cix => $component ) {
            if(( self::$INDEX == $argType ) && ( $index == $cix )) {
                unset( $this->components[$cix] );
                $remove = true;
                break;
            }
            elseif( $argType == $component->getCompType()) {
                if( $index == $cix2dC ) {
                    unset( $this->components[$cix] );
                    $argType = strtolower( $argType );
                    if( isset( $this->compix[$argType] )) {
                        unset( $this->compix[$argType] );
                    }
                    $remove = true;
                    break;
                }
                $cix2dC++;
            }
            elseif( ! $argType &&
                ! Util::isCompInList( $component->getCompType(), self::$SUBCOMPS ) &&
                ( $arg1 == $component->getUid())) {
                unset( $this->components[$cix] );
                $remove = true;
                break;
            }
        } // end foreach( $this->components as $cix => $component )
        if( $remove ) {
            $this->components = array_filter( $this->components );
            return true;
        }
        return false;
    }

    /**
     * Return next component index
     *
     * @return int
     * @access protected
     * @since  2.27.2 - 2018-12-21
     */
    protected function getNextComponentIndex() {
        return ( empty( $this->components ))
            ? 0
            : key( array_slice( $this->components, -1, 1, true )) + 1;
    }

    /**
     * Add calendar component as subcomponent to container for subcomponents
     *
     * @param CalendarComponent $component
     * @param mixed             $arg1      ordno/component type/ component uid
     * @param mixed             $arg2      ordno if arg1 = component type
     * @throws InvalidArgumentException
     * @return static
     * @since  2.27.3 - 2018-12-21
     */
    public function setComponent( CalendarComponent $component, $arg1 = false, $arg2 = false ) {
        $component->setConfig( $this->getConfig(), false, true );
        if( ! Util::isCompInList( $component->getCompType(), self::$SUBCOMPS )) {
            /* make sure dtstamp and uid is set */
            $component->getDtstamp();
            $component->getUid();
        }
        if( ! $arg1 ) { // plain insert, last in chain
            self::assertComponents( $this, $component );
            $this->components[] = clone $component;
            return $this;
        }
        $argType = $index = null;
        if( ctype_digit((string) $arg1 )) { // index insert/replace
            $argType = self::$INDEX;
            $index   = (int) $arg1 - 1;
        }
        elseif( Util::isCompInList( $arg1, self::$MCOMPS )) {
            $argType = ucfirst( strtolower( $arg1 ));
            $index   = ( ctype_digit((string) $arg2 )) ? ((int) $arg2 ) - 1 : 0;
        }
        // else if arg1 is set, arg1 must be an UID
        $cix2sC = 0;
        foreach( $this->components as $cix => $component2 ) {
            if( empty( $component2 )) {
                continue;
            }
            if(( self::$INDEX == $argType ) && ( $index == $cix )) {
                // index insert/replace
                $this->components[$cix] = clone $component;
                return $this;
            }
            elseif( $argType == $component2->getCompType()) {
                // component Type index insert/replace
                if( $index == $cix2sC ) {
                    $this->components[$cix] = clone $component;
                    return $this;
                }
                $cix2sC++;
            }
            elseif( ! $argType &&
                ! Util::isCompInList( $component2->getCompType(), self::$SUBCOMPS ) &&
                ( $arg1 == $component2->getUid())) { // UID insert/replace
                $this->components[$cix] = clone $component;
                return $this;
            }
        }
        if( self::$INDEX == $argType ) { // arg1=index and not found.. . insert at index .. .
            $this->components[$index] = clone $component;
            ksort( $this->components, SORT_NUMERIC );
        }
        else {   /* not found.. . insert last in chain anyway .. .*/
            $this->components[] = clone $component;
        }
        return $this;
    }

    /**
     * Assert base components
     *
     * @param IcalBase $component
     * @access protected
     * @static
     * @throws InvalidArgumentException
     * @since  2.27.6 - 2018-12-28
     */
    protected static function assertBaseComponents( IcalBase $component ) {
        static $ERRMSG = 'Invalid component type \'%s\'';
        $compType = $component->getCompType();
        if( ! Util::isCompInList( $compType, self::$VCOMPS ) &&
             ( self::VTIMEZONE != $compType )) {
            throw new InvalidArgumentException( sprintf( $ERRMSG, $compType ));
        }
    }

    /**
     * Assert components
     *
     * @param IcalBase $comp
     * @param CalendarComponent $subComp
     * @throws InvalidArgumentException
     * @access private
     * @static
     * @since  2.27.6 - 2018-12-28
     */
    private static function assertComponents( IcalBase $comp, CalendarComponent $subComp ) {
        static $MSG = 'Unknown component %s';
        $type    = $comp->getCompType();
        $subType = $subComp->getCompType();
        switch( $type ) {
            case Vcalendar::VCALENDAR :
                self::assertBaseComponents( $subComp );
                break;
            case self::VTIMEZONE :
                switch( $subType ) {
                    case self::STANDARD :
                        break 2;
                    case self::DAYLIGHT :
                        break 2;
                    default :
                        throw new InvalidArgumentException( sprintf( $MSG, $subType ));
                }
                break;
            case self::VEVENT :
                // fall through
            case self::VTODO :
                switch( $subType ) {
                    case self::VALARM :
                        break 2;
                    default :
                        throw new InvalidArgumentException( sprintf( $MSG, $subType ));
                }
                break;
            case self::VFREEBUSY :
                break;
            case self::VJOURNAL :
                break;
            default :
                throw new InvalidArgumentException( sprintf( $MSG, $type ));
        }
    }

}
