<?php
/**
  * iCalcreator, the PHP class package managing iCal (rfc2445/rfc5445) calendar information.
 *
 * copyright (c) 2007-2019 Kjell-Inge Gustafsson, kigkonsult, All rights reserved
 * Link      https://kigkonsult.se
 * Package   iCalcreator
 * Version   2.28
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
use Kigkonsult\Icalcreator\Util\CalAddressFactory;
use Kigkonsult\Icalcreator\Util\RecurFactory;
use Kigkonsult\Icalcreator\Util\RexdateFactory;
use Kigkonsult\Icalcreator\Util\StringFactory;
use Exception;
use InvalidArgumentException;
use UnexpectedValueException;

use function array_filter;
use function array_keys;
use function count;
use function ctype_digit;
use function end;
use function explode;
use function func_get_args;
use function func_num_args;
use function get_called_class;
use function implode;
use function in_array;
use function is_array;
use function is_null;
use function ksort;
use function property_exists;
use function reset;
use function sprintf;
use function strcasecmp;
use function stripos;
use function strlen;
use function strpos;
use function strtolower;
use function strtoupper;
use function substr;
use function trim;
use function ucfirst;
use function var_export;

/**
 *  Parent class for calendar components
 *
 * @author Kjell-Inge Gustafsson, kigkonsult <ical@kigkonsult.se>
 * @since  2.27.6 - 2019-01-02
 */
abstract class CalendarComponent extends IcalBase
{
    /**
     * @var array  compoment sort params
     */
    public $srtk = null;

    /**
     * @var string component number
     */
    public $cno = 0;

    /**
     * @var array datetime properties, may have TZID
     * @access protected
     * @static
     */
    protected static $DTPROPS  = [ self::DTEND, self::DTSTART, self::DUE, self::RECURRENCE_ID ];

    /**
     * @var string  misc. values
     * @access protected
     * @static
     */
    protected static $ALTRPLANGARR  = [ self::ALTREP, self::LANGUAGE ];
    protected static $FMTBEGIN      = "BEGIN:%s\r\n";
    protected static $FMTEND        = "END:%s\r\n";

    /**
     * @var string
     * @access protected
     * @static
     */
    protected static $compSgn = 'xx';

    /**
     * Constructor for calendar component
     *
     * @param array $config
     * @since  2.27.14 - 2019-02-20
     */
    public function __construct( $config = [] ) {
        static $objectNo = 0;
        $class           = get_called_class();
        $this->compType  = ucfirst( strtolower( StringFactory::after_last( self::$BS, $class  )));
        $this->cno       = $class::$compSgn . ++$objectNo;
        $this->setConfig( $config );
    }

    /**
     * Assert value in enumeration
     *
     * @param mixed  $value
     * @param array  $enumeration - all upper case
     * @param string $propName
     * @throws InvalidArgumentException
     * @access protected
     * @static
     * @since  2.27.2 - 2019-01-04
     */
    protected static function assertInEnumeration( $value, array $enumeration, $propName ) {
        static $ERR = 'Invalid %s value : %s';
        if( ! in_array( strtoupper( $value ), $enumeration )) {
            throw new InvalidArgumentException( sprintf( $ERR, $propName, var_export( $value, true )));
        }
    }

    /**
     * Assert value is integer
     *
     * @param mixed  $value
     * @param string $propName
     * @param int $rangeMin
     * @param int $rangeMax
     * @throws InvalidArgumentException
     * @access protected
     * @static
     * @since  2.27.14 - 2019-02-19
     */
    protected static function assertIsInteger( $value, $propName, $rangeMin = null, $rangeMax = null ) {
        static $ERR1 = 'Invalid %s integer value %s';
        static $ERR2 = '%s value %s not in range (%d-%d)';
        if( ! is_scalar( $value) || ! ctype_digit((string) $value )) {
            throw new InvalidArgumentException(
                sprintf( $ERR1, $propName, var_export( $value, true ))
            );
        }
        if((  ! is_null( $rangeMin )  && ( $rangeMin > $value )) ||
            ( ! is_null( $rangeMax )) && ( $rangeMax < $value )) {
            throw new InvalidArgumentException(
                sprintf( $ERR2, $propName, $value, $rangeMin, $rangeMax )
            );
        }

    }

    /**
     * Delete component property value
     *
     * Return false at successfull removal of non-multiple property
     * Return false at successfull removal of last multiple property part
     * otherwise true (there is more to remove)
     *
     * @param mixed $propName
     * @param int   $propDelIx   specific property in case of multiply occurrence
     * @return bool
     * @deprecated in favor of properties delete method
     * @since  2.27.1 - 2018-12-16
     */
    public function deleteProperty( $propName = null, $propDelIx = null ) {
        if( empty( $propName ) || StringFactory::isXprefixed( $propName )) {
            return $this->deleteXprop( $propName, $propDelIx );
        }
        if( ! property_exists( $this, parent::getInternalPropName( $propName ))) {
            return false;
        }
        $method = parent::getDeleteMethodName( $propName );
        if( Util::isPropInList( $propName, self::$MPROPS2 )) {
            return $this->{$method}( $propDelIx );
        }
        return $this->{$method}();
    }

    /**
     * Return component property value/params
     *
     * Return array with keys VALUE/PARAMS rf arg $inclParam is true
     * If property has multiply values, consequtive function calls are needed
     *
     * @param string $propName
     * @param int    $propIx specific property in case of multiply occurrence
     * @param bool   $inclParam
     * @param bool   $specform
     * @return mixed
     * @deprecated  in favor of properties get method
     * @since  2.27.1 - 2018-12-17
     */
    public function getProperty(
        $propName  = null,
        $propIx    = null,
        $inclParam = false,
        $specform  = false
    ) {
        if( 0 == strcasecmp( self::GEOLOCATION, $propName )) {
            return ( Util::isCompInList( $this->getCompType(), [self::VEVENT, self::VTODO] ))
                ? $this->getGeoLocation()
                : false;
        }
        if( empty( $propName ) || StringFactory::isXprefixed( $propName )) {
            return $this->getXprop( $propName, $propIx, $inclParam );
        }
        $method       = parent::getGetMethodName( $propName );
        $propName     = strtoupper( $propName );
        switch( true ) {
            case ( self::DTSTAMP == $propName ) :
                if( ! Util::isCompInList( $this->getCompType(), self::$SUBCOMPS )) {
                    return $this->{$method}( $inclParam );
                }
                break;
            case ( self::UID == $propName ) :
                if( ! Util::isCompInList( $this->getCompType(), self::$SUBCOMPS )) {
                    return $this->{$method}( $inclParam );
                }
                break;
            case ( ! property_exists( $this, parent::getInternalPropName( $propName ))) :
                break;
            case ( self::DURATION == $propName ) :
                return $this->{$method}( $inclParam, $specform );
                break;
            case ( Util::isPropInList( $propName, self::$MPROPS2 )) ;
                return $this->{$method}( $propIx, $inclParam );
                break;
            default :
                return $this->{$method}( $inclParam );
                break;
        } // end switch( true )
        return false;
    }

    /**
     * Returns calendar property unique values
     *
     * For ATTENDEE, CATEGORIES, CONTACT, RELATED_TO or RESOURCES (keys)
     * and for each, number of occurrence (values)
     *
     * @param string $propName
     * @param array  $output incremented result array
     * @since  2.27.1 - 2018-12-15
     */
    public function getProperties( $propName, & $output ) {
        if( empty( $output )) {
            $output = [];
        }
        if( ! Util::isPropInList( $propName, self::$MPROPS1 )) {
            return;
        }
        $method = parent::getGetMethodName( $propName );
        while( false !== ( $content = $this->{$method}())) {
            if( empty( $content )) {
                continue;
            }
            if( is_array( $content )) {
                foreach( $content as $part ) {
                    if( false !== strpos( $part, Util::$COMMA )) {
                        $part = explode( Util::$COMMA, $part );
                        foreach( $part as $contentPart ) {
                            $contentPart = trim( $contentPart );
                            if( ! empty( $contentPart )) {
                                if( ! isset( $output[$contentPart] )) {
                                    $output[$contentPart] = 1;
                                }
                                else {
                                    $output[$contentPart] += 1;
                                }
                            }
                        }
                    }
                    else {
                        $part = trim( $part );
                        if( ! isset( $output[$part] )) {
                            $output[$part] = 1;
                        }
                        else {
                            $output[$part] += 1;
                        }
                    }
                }
            } // end if( is_array( $content ))
            elseif( false !== strpos( $content, Util::$COMMA )) {
                $content = explode( Util::$COMMA, $content );
                foreach( $content as $contentPart ) {
                    $contentPart = trim( $contentPart );
                    if( ! empty( $contentPart )) {
                        if( ! isset( $output[$contentPart] )) {
                            $output[$contentPart] = 1;
                        }
                        else {
                            $output[$contentPart] += 1;
                        }
                    }
                }
            } // end elseif( false !== strpos( $content, Util::$COMMA ))
            else {
                $content = trim( $content );
                if( ! empty( $content )) {
                    if( ! isset( $output[$content] )) {
                        $output[$content] = 1;
                    }
                    else {
                        $output[$content] += 1;
                    }
                }
            }
        }
        ksort( $output );
    }

    /**
     * General component setProperty method
     *
     * @param mixed $args variable number of function arguments,
     *                    first argument is ALWAYS component name,
     *                    second ALWAYS component value!
     * @return static
     * @throws InvalidArgumentException
     * @deprecated in favor of properties set method
     * @since  2.27.3 - 2018-12-21
     */
    public function setProperty( $args ) {
        static $ERRMSG1 = 'No property to set';
        static $ERRMSG2 = 'No property %s in %s';
        $numArgs = func_num_args();
        if( 1 > $numArgs ) {
            throw new InvalidArgumentException( $ERRMSG1 );
        }
        $args    = func_get_args();
        for( $argIx = $numArgs; $argIx < 12; $argIx++ ) {
            if( ! isset( $args[$argIx] )) {
                $args[$argIx] = null;
            }
        }
        if( empty( $args[0] ) || StringFactory::isXprefixed( $args[0] )) {
            return $this->setXprop( $args[0], $args[1], $args[2] );
        }
        if( ! property_exists( $this, parent::getInternalPropName( $args[0] ))) {
            throw new InvalidArgumentException( sprintf( $ERRMSG2,  $args[0], $this->getCompType()));
        }
        $method = parent::getSetMethodName( $args[0] );
        switch( strtoupper( $args[0] )) {
            case self::ACTION:
                return $this->{$method}( $args[1], $args[2] );
                break;
            case self::ATTACH:
                return $this->{$method}( $args[1], $args[2], $args[3] );
                break;
            case self::ATTENDEE:
                return $this->{$method}( $args[1], $args[2], $args[3] );
                break;
            case self::CATEGORIES:
                return $this->{$method}( $args[1], $args[2], $args[3] );
                break;
            case self::KLASS:
                return $this->{$method}( $args[1], $args[2] );
                break;
            case self::COMMENT:
                return $this->{$method}( $args[1], $args[2], $args[3] );
                break;
            case Vcalendar::COMPLETED:
                return $this->{$method}( $args[1], $args[2], $args[3], $args[4], $args[5], $args[6], $args[7] );
                break;
            case self::CONTACT:
                return $this->{$method}( $args[1], $args[2], $args[3] );
                break;
            case self::CREATED:
                return $this->{$method}( $args[1], $args[2], $args[3], $args[4], $args[5], $args[6], $args[7] );
                break;
            case self::DESCRIPTION:
                return $this->{$method}( $args[1], $args[2], $args[3] );
                break;
            case self::DTEND:
                return $this->{$method}( $args[1], $args[2], $args[3], $args[4], $args[5], $args[6], $args[7], $args[8] );
                break;
            case self::DTSTAMP:
                return $this->{$method}( $args[1], $args[2], $args[3], $args[4], $args[5], $args[6], $args[7] );
                break;
            case self::DTSTART:
                return $this->{$method}( $args[1], $args[2], $args[3], $args[4], $args[5], $args[6], $args[7], $args[8] );
                break;
            case self::DUE:
                return $this->{$method}( $args[1], $args[2], $args[3], $args[4], $args[5], $args[6], $args[7], $args[8] );
                break;
            case self::DURATION:
                return $this->{$method}( $args[1], $args[2], $args[3], $args[4], $args[5],  $args[6] );
                break;
            case self::EXDATE:
                return $this->{$method}( $args[1], $args[2], $args[3] );
                break;
            case self::EXRULE:
                return $this->{$method}( $args[1], $args[2], $args[3] );
                break;
            case self::FREEBUSY:
                return $this->{$method}( $args[1], $args[2], $args[3], $args[4] );
                break;
            case self::GEO:
                return $this->{$method}( $args[1], $args[2], $args[3] );
                break;
            case self::LAST_MODIFIED:
                return $this->{$method}( $args[1], $args[2], $args[3], $args[4], $args[5], $args[6], $args[7] );
                break;
            case self::LOCATION:
                return $this->{$method}( $args[1], $args[2] );
                break;
            case self::ORGANIZER:
                return $this->{$method}( $args[1], $args[2] );
                break;
            case self::PERCENT_COMPLETE:
                return $this->{$method}( $args[1], $args[2] );
                break;
            case self::PRIORITY:
                return $this->{$method}( $args[1], $args[2] );
                break;
            case self::RDATE:
                return $this->{$method}( $args[1], $args[2], $args[3] );
                break;
            case self::RECURRENCE_ID:
                return $this->{$method}( $args[1], $args[2], $args[3], $args[4], $args[5], $args[6], $args[7], $args[8] );
                break;
            case self::RELATED_TO:
                return $this->{$method}( $args[1], $args[2], $args[3] );
                break;
            case self::REPEAT:
                return $this->{$method}( $args[1], $args[2] );
                break;
            case self::REQUEST_STATUS:
                return $this->{$method}( $args[1], $args[2], $args[3], $args[4], $args[5] );
                break;
            case self::RESOURCES:
                return $this->{$method}( $args[1], $args[2], $args[3] );
                break;
            case self::RRULE:
                return $this->{$method}( $args[1], $args[2], $args[3] );
                break;
            case self::SEQUENCE:
                return $this->{$method}( $args[1], $args[2] );
                break;
            case self::STATUS:
                return $this->{$method}( $args[1], $args[2] );
                break;
            case self::SUMMARY:
                return $this->{$method}( $args[1], $args[2] );
                break;
            case self::TRANSP:
                return $this->{$method}( $args[1], $args[2] );
                break;
            case self::TRIGGER:
                return $this->{$method}( $args[1], $args[2], $args[3], $args[4], $args[5], $args[6], $args[7], $args[8], $args[9], $args[10], $args[11] );
                break;
            case self::TZID:
                return $this->{$method}( $args[1], $args[2] );
                break;
            case self::TZNAME:
                return $this->{$method}( $args[1], $args[2], $args[3] );
                break;
            case self::TZOFFSETFROM:
                return $this->{$method}( $args[1], $args[2] );
                break;
            case self::TZOFFSETTO:
                return $this->{$method}( $args[1], $args[2] );
                break;
            case self::TZURL:
                return $this->{$method}( $args[1], $args[2] );
                break;
            case self::UID:
                return $this->{$method}( $args[1], $args[2] );
                break;
            case self::URL:
                return $this->{$method}( $args[1], $args[2] );
                break;
            default:
                break;
        } // end switch
        return $this;
    }

    /*
     * @var string
     * @access proteceted
     * @static
     */
    protected static $NLCHARS = '\n';
    protected static $BEGIN   = 'BEGIN:';

    /**
     * Parse data into component properties
     *
     * @param mixed $unParsedText strict rfc2445 formatted, single property string or array of strings
     * @return static
     * @throws Exception
     * @throws UnexpectedValueException;
     * @since  2.27.14 - 2019-02-24
     * @// todo report invalid properties, Exception.. ??
     */
    public function parse( $unParsedText = null ) {
        $rows = $this->parse1prepInput( $unParsedText );
        $this->parse2intoComps( $rows );
        $this->parse3thisProperties();
        $this->parse4subComps();
        return $this;
    }

    /**
     * Return rows to parse
     *
     * @param mixed $unParsedText strict rfc2445 formatted, single property string or array of strings
     * @return array
     * @access private
     * @static
     * @since  2.27.22 - 2019-06-17
     */
    private function parse1prepInput( $unParsedText = null ) {
        switch( true ) {
            case ( ! empty( $unParsedText )) :
                $arrParse = false;
                if( is_array( $unParsedText ) ) {
                    $unParsedText = implode( self::$NLCHARS . Util::$CRLF, $unParsedText );
                    $arrParse     = true;
                }
                $rows = StringFactory::convEolChar( $unParsedText );
                if( $arrParse ) {
                    foreach( $rows as $lix => $row ) {
                        $rows[$lix] = StringFactory::trimTrailNL( $row );
                    }
                }
                break;
            case empty( $this->unparsed ) :
                $rows = [];
                break;
            default :
                $rows = $this->unparsed;
                break;
        } // end switch
        /* skip leading (empty/invalid) lines */
        foreach( $rows as $lix => $row ) {
            if( false !== ( $pos = stripos( $row, self::$BEGIN ))) {
                $rows[$lix] = substr( $row, $pos );
                break;
            }
            $tst = trim( $row );
            if(( self::$NLCHARS == $tst ) || empty( $tst )) {
                unset( $rows[$lix] );
            }
        }
        return $rows;
    }

    /**
     * Parse into comps
     *
     * @param array $rows
     * @access private
     * @static
     * @since  2.27.22 - 2019-06-17
     */
    private function parse2intoComps( array $rows ) {
        static $ENDALARM        = 'END:VALARM';
        static $ENDDAYLIGHT     = 'END:DAYLIGHT';
        static $ENDSTANDARD     = 'END:STANDARD';
        static $END             = 'END:';
        static $BEGINVALARM     = 'BEGIN:VALARM';
        static $BEGINSTANDARD   = 'BEGIN:STANDARD';
        static $BEGINDAYLIGHT   = 'BEGIN:DAYLIGHT';
        $this->unparsed = [];
        $comp           = $this;
        $compSync       = $subSync = 0;
        foreach( $rows as $lix => $row ) {
            switch( true ) {
                case ( 0 == strcasecmp( $ENDALARM, substr( $row, 0, 10 ))) :
                    if( 1 != $subSync ) {
                        throw new UnexpectedValueException( self::getErrorMsg( $rows, $lix ));
                    }
                    $subSync -= 1;
                    break;
                case ( 0 == strcasecmp( $ENDDAYLIGHT, substr( $row, 0, 12 ))) :
                    if( 1 != $subSync ) {
                        throw new UnexpectedValueException( self::getErrorMsg( $rows, $lix ));
                    }
                    $subSync -= 1;
                    break;
                case ( 0 == strcasecmp( $ENDSTANDARD, substr( $row, 0, 12 ))) :
                    if( 1 != $subSync ) {
                        throw new UnexpectedValueException( self::getErrorMsg( $rows, $lix ));
                    }
                    $subSync -= 1;
                    break;
                case ( 0 == strcasecmp( $END, substr( $row, 0, 4 ))) :
                    if( 1 != $compSync ) { // end:<component>
                        throw new UnexpectedValueException( self::getErrorMsg( $rows, $lix ));
                    }
                    $compSync -= 1;
                    break 2;  /* skip trailing empty lines.. */
                case ( 0 == strcasecmp( $BEGINVALARM, substr( $row, 0, 12 ))) :
                    $comp     = $this->newValarm();
                    $subSync += 1;
                    break;
                case ( 0 == strcasecmp( $BEGINSTANDARD, substr( $row, 0, 14 ))) :
                    $comp     = $this->newStandard();
                    $subSync += 1;
                    break;
                case ( 0 == strcasecmp( $BEGINDAYLIGHT, substr( $row, 0, 14 ))) :
                    $comp     = $this->newDaylight();
                    $subSync += 1;
                    break;
                case ( 0 == strcasecmp( self::$BEGIN, substr( $row, 0, 6 ))) :
                    $compSync += 1;         // begin:<component>
                    break;
                default :
                    $comp->unparsed[] = $row;
                    break;
            } // end switch( true )
        } // end foreach( $rows as $lix => $row )
    }

    /**
     * Parse this properties
     *
     * @access private
     * @static
     * @since  2.27.22 - 2019-06-17
     */
    private function parse3thisProperties() {
        static $TEXTPROPS = [ self::CATEGORIES, self::COMMENT, self::DESCRIPTION, self::SUMMARY, ];
        /* concatenate property values spread over several lines */
        $this->unparsed = StringFactory::concatRows( $this->unparsed );
        /* parse each property 'line' */
        foreach( $this->unparsed as $lix => $row ) {
            /* get propname  +  split property name  and  opt.params and value */
            list( $propName, $row ) = StringFactory::getPropName( $row );
            if( StringFactory::isXprefixed( $propName )) {
                $propName2 = $propName;
                $propName  = self::X_PROP;
            }
            else {
                if( ! property_exists( $this, parent::getInternalPropName( $propName ))) {
                    continue; // todo report invalid properties
                } // skip property names not in comp
                $propName2 = null;
            }
            /* separate attributes from value */
            list( $value, $propAttr ) = StringFactory::splitContent( $row );
            if(( self::$NLCHARS == strtolower( substr( $value, -2 ))) &&
                ! Util::isPropInList( $propName, $TEXTPROPS ) &&
                ( ! StringFactory::isXprefixed( $propName ))) {
                $value = StringFactory::trimTrailNL( $value );
            }
            /* call set<Propname>(.. . */
            $method = parent::getSetMethodName( $propName );
            switch( strtoupper( $propName )) {
                case self::ATTENDEE :
                    list( $value, $propAttr ) = CalAddressFactory::parseAttendee( $value, $propAttr );
                    $this->{$method}( $value, $propAttr );
                    break;
                case self::CATEGORIES :
                    // fall through
                case self::RESOURCES :
                    list( $value, $propAttr ) = self::parseText( $value, $propAttr );
                    $this->{$method}( $value, $propAttr );
                    break;
                case self::COMMENT :
                    // fall through
                case self::CONTACT :
                    // fall through
                case self::DESCRIPTION :
                    // fall through
                case self::LOCATION :
                    // fall through
                case self::SUMMARY :
                    if( empty( $value )) {
                        $propAttr = null;
                    }
                    $this->{$method}( StringFactory::strunrep( $value ), $propAttr );
                    break;
                case self::REQUEST_STATUS :
                    $values    = explode( Util::$SEMIC, $value, 3 );
                    $values[1] = ( isset( $values[1] )) ? StringFactory::strunrep( $values[1] ) : null;
                    $values[2] = ( isset( $values[2] )) ? StringFactory::strunrep( $values[2] ) : null;
                    $this->{$method}( $values[0], $values[1], $values[2], $propAttr );
                    break;
                case self::FREEBUSY :
                    $class = get_class( $this );
                    list( $fbtype, $values, $propAttr ) = $class::parseFreebusy( $value, $propAttr );
                    $this->{$method}( $fbtype, $values, $propAttr );
                    break;
                case self::GEO :
                    $values = explode( Util::$SEMIC, $value, 2 );
                    if( 2 > count( $values )) {
                        $values[1] = null;
                    }
                    $this->{$method}( $values[0], $values[1], $propAttr );
                    break;
                case self::EXDATE :
                    $values = ( empty( $value )) ? null : explode( Util::$COMMA, $value );
                    $this->{$method}( $values, $propAttr );
                    break;
                case self::RDATE :
                    list( $values, $propAttr ) = RexdateFactory::parseRexdate( $value, $propAttr );
                    $this->{$method}( $values, $propAttr );
                    break;
                case self::EXRULE :
                    // fall through
                case self::RRULE :
                    $recur  = RecurFactory::parseRexrule( $value );
                    $this->{$method}( $recur, $propAttr );
                    break;
                case self::X_PROP :
                    $propName = ( isset( $propName2 )) ? $propName2 : $propName;
                    $this->setXprop( $propName, StringFactory::strunrep( $value ), $propAttr );
                    break;
                case self::ACTION :
                    // fall through
                case self::STATUS :
                    // fall through
                case self::TRANSP :
                    // fall through
                case self::UID :
                    // fall through
                case self::TZID :
                    // fall through
                case self::RELATED_TO :
                    // fall through
                case self::TZNAME :
                    $value = StringFactory::strunrep( $value );
                // fall through
                default:
                    $this->{$method}( $value, $propAttr );
                    break;
            } // end  switch( $propName.. .
        } // end foreach( $this->unparsed as $lix => $row )
        unset( $this->unparsed );
    }

    /**
     * parse sub-components
     *
     * @access private
     * @static
     * @since  2.27.11 - 2019-01-04
     */
    private function parse4subComps() {
        if( empty( $this->countComponents())) {
            return;
        }
        foreach( array_keys( $this->components ) as $cix ) {
            if( ! empty( $this->components[$cix] ) &&
                ! empty( $this->components[$cix]->unparsed )) {
                $this->components[$cix]->parse();
            }
        } // end foreach
    }

    /**
     * Return value and parameters from parsed row and propAttr
     *
     * @param string $row
     * @param array $propAttr
     * @return array
     * @access private
     * @static
     * @since  2.27.11 - 2019-01-04
     */
    private static function parseText( $row, array $propAttr ) {
        if( false !== strpos( $row, Util::$COMMA )) {
            $value = self::commaSplit( $row );
            if( 1 < count( $value )) {
                foreach( $value as & $valuePart ) {
                    $valuePart = StringFactory::strunrep( $valuePart );
                }
            }
            else {
                $value = reset( $value );
            }
        }
        else {
            $value = $row;
        }
        return [ $value, $propAttr ];
    }

    /**
     * Return array from content split by '\,'
     *
     * @param string $content
     * @return array
     * @access private
     * @static
     * @since  2.23.8 - 2017-04-16
     */
    private static function commaSplit( $content ) {
        static $DBBS = "\\";
        $output = [ 0 => null ];
        $cix    = $lix = 0;
        $len    = strlen( $content );
        while( $lix < $len ) {
            if( ( Util::$COMMA == $content[$lix] ) && ( $DBBS != $content[( $lix - 1 )] )) {
                $output[++$cix] = null;
            }
            else {
                $output[$cix] .= $content[$lix];
            }
            $lix++;
        }
        return array_filter( $output );
    }

    /**
     * Return error message
     *
     * @param array $rows
     * @param int $lix
     * @return string
     * @access private
     * @static
     * @since  2.26.3 - 2018-12-28
     */
    private static function getErrorMsg( array $rows, $lix ) {
        static $ERR = 'Calendar component content not in sync (row %d)%s%s';
        return sprintf( $ERR, $lix, PHP_EOL, implode( PHP_EOL, $rows ));
    }

    /**
     * Return calendar component subcomponent from component container
     *
     * @param mixed $arg1 ordno/component type/ component uid
     * @param mixed $arg2 ordno if arg1 = component type
     * @return mixed CalendarComponent|bool
     * @since  2.26.1 - 2018-11-17
     * @todo throw InvalidArgumentException on unknown component
     */
    public function getComponent( $arg1 = null, $arg2 = null ) {
        if( empty( $this->components )) {
            return false;
        }
        $index = $argType = null;
        switch( true ) {
            case ( is_null( $arg1 )) :
                $argType = self::$INDEX;
                $this->compix[self::$INDEX] = ( isset( $this->compix[self::$INDEX] ))
                    ? $this->compix[self::$INDEX] + 1 : 1;
                $index   = $this->compix[self::$INDEX];
                break;
            case ( ctype_digit((string) $arg1 )) :
                $argType = self::$INDEX;
                $index   = (int) $arg1;
                $this->compix = [];
                break;
            case ( Util::isCompInList( $arg1, self::$SUBCOMPS )) : // class name
                unset( $this->compix[self::$INDEX] );
                $argType = strtolower( $arg1 );
                if( is_null( $arg2 )) {
                    $index = $this->compix[$argType] = ( isset( $this->compix[$argType] ))
                        ? $this->compix[$argType] + 1 : 1;
                }
                else {
                    $index = (int) $arg2;
                }
                break;
        }
        $index -= 1;
        $ckeys = array_keys( $this->components );
        if( ! empty( $index ) && ( $index > end( $ckeys ))) {
            return false;
        }
        $cix2gC = 0;
        foreach( $ckeys as $cix ) {
            if( empty( $this->components[$cix] )) {
                continue;
            }
            if(( self::$INDEX == $argType ) && ( $index == $cix )) {
                return clone $this->components[$cix];
            }
            elseif( 0 == strcasecmp( $this->components[$cix]->getCompType(), $argType )) {
                if( $index == $cix2gC ) {
                    return clone $this->components[$cix];
                }
                $cix2gC++;
            }
        }
        /* not found.. . */
        $this->compix = [];
        return false;
    }

    /**
     * Add calendar component as subcomponent to container for subcomponents
     *
     * @param CalendarComponent $component
     * @return static
     * @since  1.x.x - 2007-04-24
     */
    public function addSubComponent( CalendarComponent $component ) {
        $this->setComponent( $component );
        return $this;
    }

    /**
     * Return formatted output for subcomponents
     *
     * @return string
     * @since  2.27.2 - 2018-12-21
     * @throws Exception  (on Valarm/Standard/Daylight) err)
     */
    public function createSubComponent() {
        $config = $this->getConfig();
        $output = null;
        foreach( array_keys( $this->components ) as $cix ) {
            if( ! empty( $this->components[$cix] )) {
                $this->components[$cix]->setConfig( $config, false, true );
                $output .= $this->components[$cix]->createComponent();
            }
        }
        return $output;
    }

}
