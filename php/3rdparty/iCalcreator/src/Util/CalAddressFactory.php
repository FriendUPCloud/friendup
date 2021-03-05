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

namespace Kigkonsult\Icalcreator\Util;

use Kigkonsult\Icalcreator\Vcalendar;
use InvalidArgumentException;

use function array_change_key_case;
use function count;
use function ctype_digit;
use function explode;
use function in_array;
use function is_array;
use function sprintf;
use function strpos;
use function strtoupper;
use function trim;

/**
 * iCalcreator attendee support class
 *
 * @author Kjell-Inge Gustafsson, kigkonsult <ical@kigkonsult.se>
 * @since  2.27.8 - 2019-03-17
 */
class CalAddressFactory
{
    /**
     * @var array
     * @access private
     * @static
     */
    private static $ParamArrayKeys = [
        Vcalendar::MEMBER,
        Vcalendar::DELEGATED_TO,
        Vcalendar::DELEGATED_FROM,
    ];

    /**
     * Return formatted output for calendar component property attendee
     *
     * @param array $attendeeData
     * @param bool  $allowEmpty
     * @return string
     * @static
     * @since  2.27.8 - 2019-03-17
     */
    public static function outputFormatAttendee( array $attendeeData, $allowEmpty ) {
        static $AllKeys = [
            Vcalendar::CUTYPE,
            Vcalendar::MEMBER,
            Vcalendar::ROLE,
            Vcalendar::PARTSTAT,
            Vcalendar::RSVP,
            Vcalendar::DELEGATED_TO,
            Vcalendar::DELEGATED_FROM,
            Vcalendar::SENT_BY,
            Vcalendar::CN,
            Vcalendar::DIR,
            Vcalendar::LANGUAGE
        ];
        static $FMTKEYVALUE = ';%s=%s';
        static $FMTDIREQ    = ';%s=%s%s%s';
        $output = null;
        foreach( $attendeeData as $ax => $attendeePart ) {
            if( empty( $attendeePart[Util::$LCvalue] )) {
                if( $allowEmpty ) {
                    $output .= StringFactory::createElement( Vcalendar::ATTENDEE );
                }
                continue;
            }
            $attributes = $content = null;
            foreach( $attendeePart as $pLabel => $pValue ) {
                if( Util::$LCvalue == $pLabel ) {
                    $content .= $pValue;
                    continue;
                }
                if(( Util::$LCparams != $pLabel ) ||
                    ( ! is_array( $pValue ))) {
                    continue;
                }
                foreach( $pValue as $pLabel2 => $pValue2 ) { // fix (opt) quotes
                    if( is_array( $pValue2 ) ||
                        in_array( $pLabel2, self::$ParamArrayKeys )) {
                        continue;
                    } // all but DELEGATED-FROM, DELEGATED-TO, MEMBER
                    if(( false !== strpos( $pValue2, Util::$COLON )) ||
                       ( false !== strpos( $pValue2, Util::$SEMIC )) ||
                       ( false !== strpos( $pValue2, Util::$COMMA ))) {
                        $pValue[$pLabel2] = self::getQuotedItem( $pValue2 );
                    }
                }
                /* set attendee parameters in rfc2445 order */
                if( isset( $pValue[Vcalendar::CUTYPE] )) {
                    $attributes .= sprintf( $FMTKEYVALUE, Vcalendar::CUTYPE, $pValue[Vcalendar::CUTYPE] );
                }
                if( isset( $pValue[Vcalendar::MEMBER] )) {
                    $attributes .= sprintf(
                        $FMTKEYVALUE,
                        Vcalendar::MEMBER,
                        self::getQuotedListItems( $pValue[Vcalendar::MEMBER] )
                    );
                }
                if( isset( $pValue[Vcalendar::ROLE] )) {
                    $attributes .= sprintf( $FMTKEYVALUE, Vcalendar::ROLE, $pValue[Vcalendar::ROLE] );
                }
                if( isset( $pValue[Vcalendar::PARTSTAT] )) {
                    $attributes .= sprintf( $FMTKEYVALUE, Vcalendar::PARTSTAT, $pValue[Vcalendar::PARTSTAT] );
                }
                if( isset( $pValue[Vcalendar::RSVP] )) {
                    $attributes .= sprintf( $FMTKEYVALUE, Vcalendar::RSVP, $pValue[Vcalendar::RSVP] );
                }
                if( isset( $pValue[Vcalendar::DELEGATED_TO] )) {
                    $attributes .= sprintf(
                        $FMTKEYVALUE,
                        Vcalendar::DELEGATED_TO,
                        self::getQuotedListItems( $pValue[Vcalendar::DELEGATED_TO] )
                    );
                }
                if( isset( $pValue[Vcalendar::DELEGATED_FROM] )) {
                    $attributes .= sprintf(
                        $FMTKEYVALUE,
                        Vcalendar::DELEGATED_FROM,
                        self::getQuotedListItems( $pValue[Vcalendar::DELEGATED_FROM] )
                    );
                }
                if( isset( $pValue[Vcalendar::SENT_BY] )) {
                    $attributes .= sprintf(
                        $FMTKEYVALUE,
                        Vcalendar::SENT_BY,
                        self::getQuotedListItems( [ $pValue[Vcalendar::SENT_BY] ] )
                    );
                }
                if( isset( $pValue[Vcalendar::CN] )) {
                    $attributes .= sprintf( $FMTKEYVALUE, Vcalendar::CN, $pValue[Vcalendar::CN] );
                }
                if( isset( $pValue[Vcalendar::DIR] )) {
                    $delim       = ( false === strpos( $pValue[Vcalendar::DIR], Util::$QQ )) ? Util::$QQ : null;
                    $attributes .= sprintf( $FMTDIREQ, Vcalendar::DIR, $delim, $pValue[Vcalendar::DIR], $delim );
                }
                if( isset( $pValue[Vcalendar::LANGUAGE] )) {
                    $attributes .= sprintf( $FMTKEYVALUE, Vcalendar::LANGUAGE, $pValue[Vcalendar::LANGUAGE] );
                }
                $xParams = [];
                foreach( $pValue as $pLabel2 => $pValue2 ) {
                    if( ! in_array( $pLabel2, $AllKeys )) {
                        $xParams[$pLabel2] = $pValue2;
                    }
                }
                if( ! empty( $xParams )) {
                    ksort( $xParams, SORT_STRING );
                    foreach( $xParams as $pLabel2 => $pValue2 ) {
                        $attributes .= sprintf( $FMTKEYVALUE, $pLabel2, $pValue2 );
                    }
                }
            } // end foreach( $attendeePart )) as $pLabel => $pValue )
            $output .= StringFactory::createElement( Vcalendar::ATTENDEE, $attributes, $content );
        } // end foreach( $attendeeData as $ax => $attendeePart )
        return $output;
    }

    /**
     * Return string of comma-separated quoted array members
     *
     * @param array $list
     * @return string
     * @access private
     * @static
     * @since  2.27.11 - 2019-01-03
     */
    private static function getQuotedListItems( array $list ) {
        foreach( $list as & $v ) {
            $v = self::getQuotedItem( $v );
        }
        return implode( Util::$COMMA, $list );
    }

    /**
     * Return quoted item
     *
     * @param array $item
     * @return string
     * @access private
     * @static
     * @since  2.27.11 - 2019-01-03
     */
    private static function getQuotedItem( $item ) {
        static $FMTQVALUE = '"%s"';
        return sprintf( $FMTQVALUE, $item );
    }

    /**
     * Return value and parameters from parsed row and propAttr
     *
     * @param string $row
     * @param array $propAttr
     * @return array
     * @since  2.27.11 - 2019-01-04
     */
    public static function parseAttendee( $row, array $propAttr ) {
        foreach( $propAttr as $pix => $attr ) {
            if( ! in_array( strtoupper( $pix ), self::$ParamArrayKeys )) {
                continue;
            }  // 'MEMBER', 'DELEGATED-TO', 'DELEGATED-FROM'
            $attr2 = explode( Util::$COMMA, $attr );
            if( 1 < count( $attr2 )) {
                $propAttr[$pix] = $attr2;
            }
        }
        return [ $row, $propAttr ];
    }

    /**
     * Return formatted output for calendar component property attendee
     *
     * @param array  $params
     * @param string $compType
     * @param string $lang
     * @return array
     * @throws InvalidArgumentException
     * @static
     * @since  2.27.8 - 2019-03-17
     */
    public static function inputPrepAttendeeParams( $params, $compType, $lang ) {
        static $XX  = 'X-';
        static $NoParamComps = [ Vcalendar::VFREEBUSY, Vcalendar::VALARM ];
        $params2    = [];
        if( is_array( $params )) {
            $params = array_change_key_case( $params, CASE_UPPER );
            foreach( $params as $pLabel => $optParamValue ) {
                if( ! StringFactory::isXprefixed( $pLabel ) &&
                    Util::isCompInList( $compType, $NoParamComps )) {
                    continue;
                }
                if( ctype_digit((string) $pLabel )) { // ??
                    $pLabel = $XX . $pLabel;
                }
                switch( $pLabel ) {
                    case Vcalendar::MEMBER:
                    case Vcalendar::DELEGATED_TO:
                    case Vcalendar::DELEGATED_FROM:
                        $params2[$pLabel] = [];
                        foreach( (array) $optParamValue as $optParamValue2 ) {
                            $optParamValue2 = self::conformCalAddress( trim( $optParamValue2, Util::$QQ ));
                            self::assertCalAddress( $optParamValue2 );
                            $params2[$pLabel][] = $optParamValue2;
                        }
                        break;
                    case Vcalendar::SENT_BY :
                        $optParamValue = self::conformCalAddress( trim( $optParamValue, Util::$QQ ));
                        self::assertCalAddress( $optParamValue );
                        $params2[$pLabel] = $optParamValue;
                        break;
                    default:
                        $params2[$pLabel] = trim( $optParamValue, Util::$QQ );
                        break;
                } // end switch( $pLabel.. .
            } // end foreach( $params as $pLabel => $optParamValue )
        } // end if( is_array($params ))
        // remove defaults
        ParameterFactory::existRem(
            $params2,
            Vcalendar::CUTYPE,
            Vcalendar::INDIVIDUAL
        );
        ParameterFactory::existRem(
            $params2,
            Vcalendar::PARTSTAT,
            Vcalendar::NEEDS_ACTION
        );
        ParameterFactory::existRem(
            $params2,
            Vcalendar::ROLE,
            Vcalendar::REQ_PARTICIPANT
        );
        ParameterFactory::existRem(
            $params2,
            Vcalendar::RSVP,
            Vcalendar::FALSE
        );
        // check language setting
        if( isset( $params2[Vcalendar::CN] ) &&
            ! isset( $params2[Vcalendar::LANGUAGE] ) &&
            ! empty( $lang )) {
            $params2[Vcalendar::LANGUAGE] = $lang;
        }
        return $params2;
    }

    /**
     * @var string Prefix for Ical cal-address etc
     * @access private
     * @static
     *
     */
    private static $MAILTOCOLON = 'MAILTO:';
    private static $AT          = '@';

    /**
     * Return conformed cal-address (i.e. MAILTO.prefixed)
     *
     * @param string $calAddress
     * @return string
     * @static
     * @since  2.27.8 - 2019-03-17
     */
    public static function conformCalAddress( $calAddress ) {
        if( ! empty( $calAddress ) &&
            ( 0 == strcasecmp( self::$MAILTOCOLON, substr( $calAddress, 0, 7 )))) {
            $calAddress = self::$MAILTOCOLON . substr( $calAddress, 7 );
        }
        return $calAddress;
    }

    /**
     * Assert cal-address (i.e. MAILTO.prefixed)
     *
     * @param string $calAddress
     * @throws InvalidArgumentException
     * @static
     * @since  2.27.8 - 2019-03-18
     */
    public static function assertCalAddress( $calAddress ) {
        static $DOT    = '.';
        static $XDOT   = 'x.';
        static $ERRMSG = 'Invalid email %s';
        if( false == strpos( $calAddress, self::$AT )) {
            throw new InvalidArgumentException( sprintf( $ERRMSG, $calAddress ));
        }
        $domain = StringFactory::after( self::$AT, $calAddress );
        if( false === strpos( StringFactory::before( self::$AT, $calAddress ), $DOT )) {
            $namePart    = self::extractNamepartFromEmail( $calAddress );
            $testAddress = $XDOT . $namePart . self::$AT . $domain;
        }
        else {
            $testAddress = self::removeMailtoPrefix( $calAddress );
        }
        if( ! filter_var( $testAddress, FILTER_VALIDATE_EMAIL ) &&
            ! filter_var( $domain, FILTER_VALIDATE_DOMAIN )) {
            throw new InvalidArgumentException( sprintf( $ERRMSG, $calAddress ));
        }
    }

    /**
     * Return email without prefix (anycase) 'MAILTO;
     *
     * @param string $email
     * @return string
     * @static
     * @since  2.27.8 - 2019-03-17
     */
    public static function removeMailtoPrefix( $email ) {
        if( self::hasMailtoPrefix( $email )) {
            return substr( $email, 7 );
        }
        return $email;
    }

    /**
     * Return bool true if email has leading MAILTO:
     *
     * @param string $email
     * @return bool
     * @access private
     * @static
     * @since  2.27.8 - 2019-03-17
     */
    private static function hasMailtoPrefix( $email ) {
        return ( 0 == strcasecmp( self::$MAILTOCOLON, substr( $email, 0, 7 )));
    }

    /**
     * Extract namePart from email
     *
     * @param string $email
     * @return string
     * @static
     * @since  2.27.8 - 2019-03-20
     */
    public static function extractNamepartFromEmail( $email ) {
        if( self::hasMailtoPrefix( $email )) {
            return StringFactory::before( self::$AT, substr( $email, 7 ));
        }
        return StringFactory::before( self::$AT, $email );
    }

    /**
     * Return cal-addresses and (hopefully) name parts
     *
     * From ATTENDEEs and ORGANIZERs, name part from CONTACTs
     * @param Vcalendar $calendar    iCalcreator Vcalendar instance
     * @param array     $properties
     * @param bool      $inclParams  fetch from values or include from parameters
     * @return array
     * @static
     * @since  2.27.8 - 2019-03-18
     */
    public static function getCalAddresses( Vcalendar $calendar, array $properties = null, $inclParams = false ) {
        $ALLOWEDPROPERTIES = [ Vcalendar::ATTENDEE, Vcalendar::CONTACT, Vcalendar::ORGANIZER ];
        if( empty( $properties )) {
            $searchProperties = $ALLOWEDPROPERTIES;
        }
        else {
            $searchProperties = [];
            foreach( $properties as $property ) {
                if( in_array( $property, $ALLOWEDPROPERTIES )) {
                    $searchProperties[] = $property;
                }
            }
        }
        $output = [];
        foreach( $searchProperties as $propName ) {
            if( $inclParams ) {
                $output = array_merge( $output, self::getCalAdressesAllFromProperty( $calendar, $propName ));
            }
            else {
                $output = array_merge( $output, self::getCalAdressValuesFromProperty( $calendar, $propName ));
            }
        } // end foreach
        sort( $output );
        $output = array_unique( $output );
        return $output;
    }

    /**
     * Return value and parameters cal-addresses from Vcalendar property
     *
     * From one of ATTENDEEs and ORGANIZERs, name part from CONTACTs
     * @param Vcalendar $calendar  iCalcreator Vcalendar instance
     * @param string    $propName
     * @return array
     * @static
     * @since  2.27.8 - 2019-03-18
     */
    public static function getCalAdressesAllFromProperty( Vcalendar $calendar, $propName ) {
        $calendar->reset();
        $output = [];
        $method = Vcalendar::getGetMethodName( $propName );
        while( $comp = $calendar->getComponent()) {
            if( ! method_exists( $comp, $method )) {
                continue;
            }
            switch( $propName ) {
                case Vcalendar::ATTENDEE :
                    while(( false !== ( $propValue = $comp->{$method}( null, true ))) && ! empty( $propValue )) {
                        $value = self::removeMailtoPrefix( $propValue[Util::$LCvalue] );
                        if( ! in_array( $value, $output )) {
                            $output[] = $value;
                        }
                        foreach( $propValue[Util::$LCparams] as $pLabel => $pValue ) {
                            switch( $pLabel ) {
                                case Vcalendar::MEMBER:
                                case Vcalendar::DELEGATED_TO:
                                case Vcalendar::DELEGATED_FROM:
                                    $params2[$pLabel] = [];
                                    foreach( $pValue as $pValue2 ) {
                                        $pValue2 = self::removeMailtoPrefix( trim( $pValue2, Util::$QQ ));
                                        if( ! in_array( $pValue2, $output )) {
                                            $output[] = $pValue2;
                                        }
                                    }
                                    break;
                                case Vcalendar::SENT_BY :
                                    $pValue2 = self::removeMailtoPrefix( trim( $pValue, Util::$QQ ));
                                    if( ! in_array( $pValue2, $output )) {
                                        $output[] = $pValue2;
                                    }
                                    break;
                            } // end switch
                        } // end foreach
                    } // end while
                    break;
                case Vcalendar::ORGANIZER :
                    if(( false === ( $propValue = $comp->{$method}( true ))) || empty( $propValue )) {
                        break;
                    }
                    $value = self::removeMailtoPrefix( $propValue[Util::$LCvalue] );
                    if( ! in_array( $value, $output ) ) {
                        $output[] = $value;
                    }
                    if( isset( $propValue[Util::$LCparams][Vcalendar::SENT_BY] ) ) {
                        $value = self::removeMailtoPrefix( $propValue[Util::$LCparams][Vcalendar::SENT_BY] );
                        if( ! in_array( $value, $output ) ) {
                            $output[] = $value;
                        }
                    }
                    break;
                case Vcalendar::CONTACT :
                    while(( false !== ( $propValue = $comp->{$method}( null, true ))) && ! empty( $propValue )) {
                        $value = ( false !== ( $pos = strpos( $propValue[Util::$LCvalue], Util::$COMMA )))
                            ? StringFactory::before( Util::$COMMA, $propValue[Util::$LCvalue] )
                            : $propValue[Util::$LCvalue];
                        try {
                            self::assertCalAddress( $value );
                        }
                        catch( InvalidArgumentException $e ) {
                            continue;
                        }
                        if( ! in_array( $value, $output )) {
                            $output[] = $value;
                        }
                    } // end while
                    break;
            } // end switch
        } // end while
        sort( $output );
        $output = array_unique( $output );
        return $output;
    }

    /**
     * Return value cal-addresses from Vcalendar property
     *
     * From one of ATTENDEEs and ORGANIZERs, name part from CONTACTs
     * @param Vcalendar $calendar  iCalcreator Vcalendar instance
     * @param string    $propName
     * @return array
     * @static
     * @since  2.27.8 - 2019-03-18
     */
    public static function getCalAdressValuesFromProperty( Vcalendar $calendar, $propName ) {
        $output = [];
        foreach( $calendar->getProperty( $propName ) as $propValue => $counts ) {
            $propValue = self::removeMailtoPrefix( $propValue );
            if( false !== strpos( $propValue, Util::$COMMA )) {
                $propValue = StringFactory::before( Util::$COMMA, $propValue );
            }
            try {
                self::assertCalAddress( $propValue );
            }
            catch( InvalidArgumentException $e ) {
                continue;
            }
            if( ! in_array( $propValue, $output )) {
                $output[] = $propValue;
            }
        } // end foreach
        sort( $output );
        $output = array_unique( $output );
        return $output;
    }

}
