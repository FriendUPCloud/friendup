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
use Kigkonsult\Icalcreator\IcalInterface;
use DateInterval;
use SimpleXMLElement;

use function array_change_key_case;
use function array_key_exists;
use function file_get_contents;
use function html_entity_decode;
use function htmlspecialchars;
use function implode;
use function in_array;
use function is_null;
use function is_array;
use function number_format;
use function sprintf;
use function str_replace;
use function strcasecmp;
use function stripos;
use function strlen;
use function strtolower;
use function strtoupper;
use function substr;
use function trim;
use function ucfirst;

/**
 * iCalcreator XML (rfc6321) support class
 *
 * @author Kjell-Inge Gustafsson, kigkonsult <ical@kigkonsult.se>
 * @since  2.27.1 - 2018-12-17
 */
class IcalXMLFactory
{
    private static $Vcalendar      = 'vcalendar';
    private static $calProps       = [
        'version',
        'prodid',
        'calscale',
        'method',
    ];
    private static $properties     = 'properties';
    private static $PARAMETERS     = 'parameters';
    private static $components     = 'components';

    private static $text           = 'text';
    private static $binary         = 'binary';
    private static $uri            = 'uri';
    private static $date           = 'date';
    private static $date_time      = 'date-time';
    private static $period         = 'period';
    private static $rstatus        = 'rstatus';
    private static $unknown        = 'unknown';
    private static $recur          = 'recur';
    private static $cal_address    = 'cal-address';
    private static $integer        = 'integer';
    private static $utc_offset     = 'utc-offset';
    private static $code           = 'code';
    private static $description    = 'description';
    private static $data           = 'data';
    private static $time           = 'time';

    private static $altrep         = 'altrep';
    private static $dir            = 'dir';
    private static $delegated_from = 'delegated-from';
    private static $delegated_to   = 'delegated-to';
    private static $member         = 'member';
    private static $sent_by        = 'sent-by';
    private static $rsvp           = 'rsvp';
    private static $bysecond       = 'bysecond';
    private static $byminute       = 'byminute';
    private static $byhour         = 'byhour';
    private static $bymonthday     = 'bymonthday';
    private static $byyearday      = 'byyearday';
    private static $byweekno       = 'byweekno';
    private static $bymonth        = 'bymonth';
    private static $bysetpos       = 'bysetpos';
    private static $byday          = 'byday';
    private static $freq           = 'freq';
    private static $count          = 'count';
    private static $interval       = 'interval';
    private static $wkst           = 'wkst';

    public static $XMLstart = '<?xml version="1.0" encoding="utf-8"?><icalendar xmlns="urn:ietf:params:xml:ns:icalendar-2.0"><!-- kigkonsult %s, iCal2XMl (rfc6321), %s --></icalendar>';

    /**
     * Return iCal XML (rfc6321) output, using PHP SimpleXMLElement
     *
     * @param Vcalendar $calendar iCalcreator Vcalendar instance reference
     * @return string
     * @static
     * @since  2.27.11 - 2019-03-08
     */
    public static function iCal2XML( Vcalendar $calendar ) {
        static $YMDTHISZ = 'Ymd\THis\Z';
        /** fix an SimpleXMLElement instance and create root element */
        $xml       = new SimpleXMLElement( sprintf( self::$XMLstart, ICALCREATOR_VERSION, gmdate( $YMDTHISZ )) );
        $Vcalendar = $xml->addChild( IcalXMLFactory::$Vcalendar );
        /** fix calendar properties */
        $properties = $Vcalendar->addChild( IcalXMLFactory::$properties );
        foreach( IcalXMLFactory::$calProps as $calProp ) {
            $method = Vcalendar::getGetMethodName( $calProp );
            if( false !== ( $content = $calendar->{$method}())) {
                IcalXMLFactory::addXMLchild( $properties, $calProp, IcalXMLFactory::$text, $content );
            }
        }
        while( false !== ( $content = $calendar->getXprop( null, null, true ))) {
            IcalXMLFactory::addXMLchild(
                $properties,
                $content[0],
                IcalXMLFactory::$unknown,
                $content[1][Util::$LCvalue],
                $content[1][Util::$LCparams]
            );
        }
        $langCal = $calendar->getConfig( Vcalendar::LANGUAGE );
        /** prepare to fix components with properties */
        $components = $Vcalendar->addChild( IcalXMLFactory::$components );
        /** fix component properties */
        while( false !== ( $component = $calendar->getComponent())) {
            $compName   = $component->getCompType();
            $child      = $components->addChild( strtolower( $compName ));
            $properties = $child->addChild( IcalXMLFactory::$properties );
            $langComp   = $component->getConfig( Vcalendar::LANGUAGE );
            $props      = $component->getConfig( Vcalendar::SETPROPERTYNAMES );
            foreach( $props as $pix => $propName ) {
                switch( strtoupper( $propName )) {
                    case Vcalendar::ATTACH :          // may occur multiple times, below
                        while( false !== ( $content = $component->getAttach( null, true ))) {
                            $type = ( ParameterFactory::isParamsValueSet( $content, Vcalendar::BINARY ))
                                ? IcalXMLFactory::$binary
                                : IcalXMLFactory::$uri;
                            unset( $content[Util::$LCparams][Vcalendar::VALUE] );
                            IcalXMLFactory::addXMLchild(
                                $properties,
                                $propName,
                                $type,
                                $content[Util::$LCvalue],
                                $content[Util::$LCparams]
                            );
                        }
                        break;
                    case Vcalendar::ATTENDEE :
                        while( false !== ( $content = $component->getAttendee( null, true ))) {
                            if( isset( $content[Util::$LCparams][Vcalendar::CN] ) &&
                              ! isset( $content[Util::$LCparams][Vcalendar::LANGUAGE] )) {
                                if( $langComp ) {
                                    $content[Util::$LCparams][Vcalendar::LANGUAGE] = $langComp;
                                }
                                elseif( $langCal ) {
                                    $content[Util::$LCparams][Vcalendar::LANGUAGE] = $langCal;
                                }
                            }
                            IcalXMLFactory::addXMLchild(
                                $properties,
                                $propName,
                                IcalXMLFactory::$cal_address,
                                $content[Util::$LCvalue],
                                $content[Util::$LCparams]
                            );
                        }
                        break;
                    case Vcalendar::EXDATE :
                        while( false !== ( $content = $component->getExdate( null, true ))) {
                            $type = ( ParameterFactory::isParamsValueSet( $content, Vcalendar::DATE ))
                                ? IcalXMLFactory::$date
                                : IcalXMLFactory::$date_time;
                            unset( $content[Util::$LCparams][Vcalendar::VALUE] );
                            IcalXMLFactory::addXMLchild(
                                $properties,
                                $propName,
                                $type,
                                $content[Util::$LCvalue],
                                $content[Util::$LCparams]
                            );
                        }
                        break;
                    case Vcalendar::FREEBUSY :
                        while( false !== ( $content = $component->getFreebusy( null, true ))) {
                            if( is_array( $content ) &&
                                isset( $content[Util::$LCvalue][Vcalendar::FBTYPE] )) {
                                $content[Util::$LCparams][Vcalendar::FBTYPE] =
                                    $content[Util::$LCvalue][Vcalendar::FBTYPE];
                                unset( $content[Util::$LCvalue][Vcalendar::FBTYPE] );
                            }
                            IcalXMLFactory::addXMLchild(
                                $properties,
                                $propName,
                                IcalXMLFactory::$period,
                                $content[Util::$LCvalue],
                                $content[Util::$LCparams]
                            );
                        }
                        break;
                    case Vcalendar::REQUEST_STATUS :
                        while( false !== ( $content = $component->getRequeststatus( null, true ))) {
                            if( ! isset( $content[Util::$LCparams][Vcalendar::LANGUAGE] )) {
                                if( $langComp ) {
                                    $content[Util::$LCparams][Vcalendar::LANGUAGE] = $langComp;
                                }
                                elseif( $langCal ) {
                                    $content[Util::$LCparams][Vcalendar::LANGUAGE] = $langCal;
                                }
                            }
                            IcalXMLFactory::addXMLchild(
                                $properties,
                                $propName,
                                IcalXMLFactory::$rstatus,
                                $content[Util::$LCvalue],
                                $content[Util::$LCparams]
                            );
                        }
                        break;
                    case Vcalendar::RDATE :
                        while( false !== ( $content = $component->getRdate( null, true ))) {
                            $type = IcalXMLFactory::$date_time;
                            if( isset( $content[Util::$LCparams][Vcalendar::VALUE] )) {
                                if( ParameterFactory::isParamsValueSet( $content, Vcalendar::DATE )) {
                                    $type = IcalXMLFactory::$date;
                                }
                                elseif( ParameterFactory::isParamsValueSet( $content, Vcalendar::PERIOD )) {
                                    $type = IcalXMLFactory::$period;
                                }
                            }
                            unset( $content[Util::$LCparams][Vcalendar::VALUE] );
                            IcalXMLFactory::addXMLchild(
                                $properties,
                                $propName,
                                $type,
                                $content[Util::$LCvalue],
                                $content[Util::$LCparams]
                            );
                        }
                        break;
                    case Vcalendar::CATEGORIES :  // fall through
                    case Vcalendar::COMMENT :     // fall through
                    case Vcalendar::CONTACT :     // fall through
                    case Vcalendar::DESCRIPTION : // fall through
                    case Vcalendar::RELATED_TO :  // fall through
                    case Vcalendar::RESOURCES :
                        $method = Vcalendar::getGetMethodName( $propName );
                        while( false !== ( $content = $component->{$method}( null, true ))) {
                            if(( Vcalendar::RELATED_TO != $propName ) &&
                                ! isset( $content[Util::$LCparams][Vcalendar::LANGUAGE] )) {
                                if( $langComp ) {
                                    $content[Util::$LCparams][Vcalendar::LANGUAGE] = $langComp;
                                }
                                elseif( $langCal ) {
                                    $content[Util::$LCparams][Vcalendar::LANGUAGE] = $langCal;
                                }
                            }
                            IcalXMLFactory::addXMLchild(
                                $properties,
                                $propName,
                                IcalXMLFactory::$text,
                                $content[Util::$LCvalue],
                                $content[Util::$LCparams]
                            );
                        }
                        break;
                    case Vcalendar::CREATED :         // single occurrence below, if set
                    case Vcalendar::COMPLETED :       // fall through
                    case Vcalendar::DTSTAMP :         // fall through
                    case Vcalendar::LAST_MODIFIED :   // fall through
                    case Vcalendar::DTSTART :         // fall through
                    case Vcalendar::DTEND :           // fall through
                    case Vcalendar::DUE :             // fall through
                    case Vcalendar::RECURRENCE_ID :   // fall through
                        $method = Vcalendar::getGetMethodName( $propName );
                        if( false !== ( $content = $component->{$method}( true ))) {
                            $type = ( ParameterFactory::isParamsValueSet( $content, Vcalendar::DATE ))
                                ? IcalXMLFactory::$date : IcalXMLFactory::$date_time;
                            unset( $content[Util::$LCparams][Vcalendar::VALUE] );
                            if(( isset( $content[Util::$LCparams][Vcalendar::TZID] ) &&
                                 empty( $content[Util::$LCparams][Vcalendar::TZID] )) ||
                                @is_null( $content[Util::$LCparams][Vcalendar::TZID] )) {
                                unset( $content[Util::$LCparams][Vcalendar::TZID] );
                            }
                            IcalXMLFactory::addXMLchild(
                                $properties,
                                $propName,
                                $type,
                                $content[Util::$LCvalue],
                                $content[Util::$LCparams]
                            );
                        }
                        break;
                    case Vcalendar::DURATION :
                        if( false !== ( $content = $component->getDuration( true ))) {
                            IcalXMLFactory::addXMLchild(
                                $properties,
                                $propName,
                                strtolower( Vcalendar::DURATION ),
                                $content[Util::$LCvalue],
                                $content[Util::$LCparams]
                            );
                        }
                        break;
                    case Vcalendar::EXRULE :
                    case Vcalendar::RRULE :
                        $method = Vcalendar::getGetMethodName( $propName );
                        // rfc5545 restriction: .. SHOULD NOT occur more than once
                        if( false !== ( $content = $component->{$method}( null, true ))) {
                            IcalXMLFactory::addXMLchild(
                                $properties,
                                $propName,
                                IcalXMLFactory::$recur,
                                $content[Util::$LCvalue],
                                $content[Util::$LCparams]
                            );
                        }
                        break;
                    case Vcalendar::KLASS :    // fall through
                    case Vcalendar::LOCATION : // fall through
                    case Vcalendar::STATUS :   // fall through
                    case Vcalendar::SUMMARY :  // fall through
                    case Vcalendar::TRANSP :   // fall through
                    case Vcalendar::TZID :     // fall through
                    case Vcalendar::UID :
                        $method = Vcalendar::getGetMethodName( $propName );
                        if( false !== ( $content = $component->{$method}( true ))) {
                            if((( Vcalendar::LOCATION == $propName ) || ( Vcalendar::SUMMARY == $propName )) &&
                                ! isset( $content[Util::$LCparams][Vcalendar::LANGUAGE] )) {
                                if( $langComp ) {
                                    $content[Util::$LCparams][Vcalendar::LANGUAGE] = $langComp;
                                }
                                elseif( $langCal ) {
                                    $content[Util::$LCparams][Vcalendar::LANGUAGE] = $langCal;
                                }
                            }
                            IcalXMLFactory::addXMLchild(
                                $properties,
                                $propName,
                                IcalXMLFactory::$text,
                                $content[Util::$LCvalue],
                                $content[Util::$LCparams]
                            );
                        }
                        break;
                    case Vcalendar::GEO :
                        if( false !== ( $content = $component->getGeo( true ))) {
                            IcalXMLFactory::addXMLchild(
                                $properties,
                                $propName,
                                strtolower( Vcalendar::GEO ),
                                $content[Util::$LCvalue],
                                $content[Util::$LCparams]
                            );
                        }
                        break;
                    case Vcalendar::ORGANIZER :
                        if( false !== ( $content = $component->getOrganizer( true ))) {
                            if( isset( $content[Util::$LCparams][Vcalendar::CN] ) &&
                              ! isset( $content[Util::$LCparams][Vcalendar::LANGUAGE] )) {
                                if( $langComp ) {
                                    $content[Util::$LCparams][Vcalendar::LANGUAGE] = $langComp;
                                }
                                elseif( $langCal ) {
                                    $content[Util::$LCparams][Vcalendar::LANGUAGE] = $langCal;
                                }
                            }
                            IcalXMLFactory::addXMLchild(
                                $properties,
                                $propName,
                                IcalXMLFactory::$cal_address,
                                $content[Util::$LCvalue],
                                $content[Util::$LCparams]
                            );
                        }
                        break;
                    case Vcalendar::PERCENT_COMPLETE : // fall through
                    case Vcalendar::PRIORITY :         // fall through
                    case Vcalendar::SEQUENCE :
                        $method = Vcalendar::getGetMethodName( $propName );
                        if( false !== ( $content = $component->{$method}( true ))) {
                            IcalXMLFactory::addXMLchild(
                                $properties,
                                $propName,
                                IcalXMLFactory::$integer,
                                $content[Util::$LCvalue],
                                $content[Util::$LCparams]
                            );
                        }
                        break;
                    case Vcalendar::TZURL :  // fall through
                    case Vcalendar::URL :
                        $method = Vcalendar::getGetMethodName( $propName );
                        if( false !== ( $content = $component->{$method}( true ))) {
                            IcalXMLFactory::addXMLchild(
                                $properties,
                                $propName,
                                IcalXMLFactory::$uri,
                                $content[Util::$LCvalue],
                                $content[Util::$LCparams]
                            );
                        }
                        break;
                    default :
                        if( ! StringFactory::isXprefixed( $propName )) {
                            break;
                        }
                        if( false !== ( $content = $component->getXprop( $propName, null, true ))) {
                            IcalXMLFactory::addXMLchild(
                                $properties,
                                $content[0],
                                IcalXMLFactory::$unknown,
                                $content[1][Util::$LCvalue],
                                $content[1][Util::$LCparams]
                            );
                        }
                        break;
                } // end switch( $propName )
            } // end foreach( $props as $pix => $propName )
            /** fix subComponent properties, if any */
            while( false !== ( $subcomp = $component->getComponent())) {
                $subCompName  = $subcomp->getCompType();
                $child2       = $child->addChild( strtolower( $subCompName ));
                $properties   = $child2->addChild( IcalXMLFactory::$properties );
                $langComp     = $subcomp->getConfig( Vcalendar::LANGUAGE );
                $subCompProps = $subcomp->getConfig( Vcalendar::SETPROPERTYNAMES );
                foreach( $subCompProps as $pix2 => $propName ) {
                    switch( strtoupper( $propName )) {
                        case Vcalendar::ATTACH :          // may occur multiple times, below
                            while( false !== ( $content = $subcomp->getAttach( null, true ))) {
                                $type = ( ParameterFactory::isParamsValueSet( $content, Vcalendar::BINARY ))
                                    ? IcalXMLFactory::$binary : IcalXMLFactory::$uri;
                                unset( $content[Util::$LCparams][Vcalendar::VALUE] );
                                IcalXMLFactory::addXMLchild(
                                    $properties,
                                    $propName,
                                    $type,
                                    $content[Util::$LCvalue],
                                    $content[Util::$LCparams]
                                );
                            }
                            break;
                        case Vcalendar::ATTENDEE :
                            while( false !== ( $content = $subcomp->getAttendee( null, true ))) {
                                if( isset( $content[Util::$LCparams][Vcalendar::CN] ) &&
                                  ! isset( $content[Util::$LCparams][Vcalendar::LANGUAGE] )) {
                                    if( $langComp ) {
                                        $content[Util::$LCparams][Vcalendar::LANGUAGE] = $langComp;
                                    }
                                    elseif( $langCal ) {
                                        $content[Util::$LCparams][Vcalendar::LANGUAGE] = $langCal;
                                    }
                                }
                                IcalXMLFactory::addXMLchild(
                                    $properties,
                                    $propName,
                                    IcalXMLFactory::$cal_address,
                                    $content[Util::$LCvalue],
                                    $content[Util::$LCparams]
                                );
                            }
                            break;
                        case Vcalendar::COMMENT : // fall through
                        case Vcalendar::TZNAME :
                            $method = Vcalendar::getGetMethodName( $propName );
                            while( false !== ( $content = $subcomp->{$method}( null, true ))) {
                                if( ! isset( $content[Util::$LCparams][Vcalendar::LANGUAGE] )) {
                                    if( $langComp ) {
                                        $content[Util::$LCparams][Vcalendar::LANGUAGE] = $langComp;
                                    }
                                    elseif( $langCal ) {
                                        $content[Util::$LCparams][Vcalendar::LANGUAGE] = $langCal;
                                    }
                                }
                                IcalXMLFactory::addXMLchild(
                                    $properties,
                                    $propName,
                                    IcalXMLFactory::$text,
                                    $content[Util::$LCvalue],
                                    $content[Util::$LCparams]
                                );
                            }
                            break;
                        case Vcalendar::RDATE :
                            while( false !== ( $content = $subcomp->getRdate( null, true ))) {
                                $type = IcalXMLFactory::$date_time;
                                if( isset( $content[Util::$LCparams][Vcalendar::VALUE] )) {
                                    if( ParameterFactory::isParamsValueSet( $content, Vcalendar::DATE )) {
                                        $type = IcalXMLFactory::$date;
                                    }
                                    elseif( ParameterFactory::isParamsValueSet( $content, Vcalendar::PERIOD )) {
                                        $type = IcalXMLFactory::$period;
                                    }
                                }
                                unset( $content[Util::$LCparams][Vcalendar::VALUE] );
                                IcalXMLFactory::addXMLchild(
                                    $properties,
                                    $propName,
                                    $type,
                                    $content[Util::$LCvalue],
                                    $content[Util::$LCparams]
                                );
                            }
                            break;
                        case Vcalendar::ACTION :      // single occurrence below, if set
                        case Vcalendar::DESCRIPTION : // fall through
                        case Vcalendar::SUMMARY :
                            $method = Vcalendar::getGetMethodName( $propName );
                            if( false !== ( $content = $subcomp->{$method}( true ))) {
                                if(( Vcalendar::ACTION != $propName ) &&
                                    ! isset( $content[Util::$LCparams][Vcalendar::LANGUAGE] )) {
                                    if( $langComp ) {
                                        $content[Util::$LCparams][Vcalendar::LANGUAGE] = $langComp;
                                    }
                                    elseif( $langCal ) {
                                        $content[Util::$LCparams][Vcalendar::LANGUAGE] = $langCal;
                                    }
                                }
                                IcalXMLFactory::addXMLchild(
                                    $properties,
                                    $propName,
                                    IcalXMLFactory::$text,
                                    $content[Util::$LCvalue],
                                    $content[Util::$LCparams]
                                );
                            }
                            break;
                        case Vcalendar::DTSTART :
                            if( false !== ( $content = $subcomp->getDtstart( true ))) {
                                if( ! empty( $content[Util::$LCvalue] )) {
                                    unset(
                                        $content[Util::$LCvalue][Util::$LCtz],
                                        $content[Util::$LCparams][Vcalendar::VALUE]
                                    ); // always local time
                                }
                                IcalXMLFactory::addXMLchild(
                                    $properties,
                                    $propName,
                                    IcalXMLFactory::$date_time,
                                    $content[Util::$LCvalue],
                                    $content[Util::$LCparams]
                                );
                            }
                            break;
                        case Vcalendar::DURATION :
                            if( false !== ( $content = $subcomp->getDuration( true ))) {
                                IcalXMLFactory::addXMLchild(
                                    $properties,
                                    $propName,
                                    strtolower( Vcalendar::DURATION ),
                                    $content[Util::$LCvalue],
                                    $content[Util::$LCparams]
                                );
                            }
                            break;
                        case Vcalendar::REPEAT :
                            if( false !== ( $content = $subcomp->getRepeat( true ))) {
                                IcalXMLFactory::addXMLchild(
                                    $properties,
                                    $propName,
                                    IcalXMLFactory::$integer,
                                    $content[Util::$LCvalue],
                                    $content[Util::$LCparams]
                                );
                            }
                            break;
                        case Vcalendar::TRIGGER :
                            if( false !== ( $content = $subcomp->getTrigger( true ))) {
                                if(( $content[Util::$LCvalue] instanceof DateInterval ) ||
                                    ( is_array( $content[Util::$LCvalue] ) &&
                                    ( isset( $content[Util::$LCvalue][$subcomp::$BEFORE] ) ||
                                      isset( $content[Util::$LCvalue][Util::$LCWEEK] ) ||
                                      isset( $content[Util::$LCvalue]['invert'] )))
                                ) {
                                    $type = strtolower( Vcalendar::DURATION );
                                }
                                else {
                                    $type = IcalXMLFactory::$date_time;
                                }
                                IcalXMLFactory::addXMLchild(
                                    $properties,
                                    $propName,
                                    $type,
                                    $content[Util::$LCvalue],
                                    $content[Util::$LCparams]
                                );
                            }
                            break;
                        case Vcalendar::TZOFFSETFROM : // fall through
                        case Vcalendar::TZOFFSETTO :
                            $method = Vcalendar::getGetMethodName( $propName );
                            if( false !== ( $content = $subcomp->{$method}( true ))) {
                                IcalXMLFactory::addXMLchild(
                                    $properties,
                                    $propName,
                                    IcalXMLFactory::$utc_offset,
                                    $content[Util::$LCvalue],
                                    $content[Util::$LCparams]
                                );
                            }
                            break;
                        case Vcalendar::RRULE :
                            // rfc5545 restriction: .. SHOULD NOT occur more than once
                            if( false !== ( $content = $subcomp->getRrule( null, true ))) {
                                IcalXMLFactory::addXMLchild(
                                    $properties,
                                    $propName,
                                    IcalXMLFactory::$recur,
                                    $content[Util::$LCvalue],
                                    $content[Util::$LCparams]
                                );
                            }
                            break;
                        default :
                            if( ! StringFactory::isXprefixed( $propName )) {
                                break;
                            }
                            if( false !== ( $content = $subcomp->getXprop( $propName, null, true ))) {
                                IcalXMLFactory::addXMLchild(
                                    $properties,
                                    $content[0],
                                    IcalXMLFactory::$unknown,
                                    $content[1][Util::$LCvalue],
                                    $content[1][Util::$LCparams]
                                );
                            }
                            break;
                    } // switch( $propName )
                } // end foreach( $subCompProps as $pix2 => $propName )
            } // end while( false !== ( $subcomp = $component->getComponent()))
        } // end while( false !== ( $component = $calendar->getComponent()))
        return $xml->asXML();
    }

    /**
     * Add XML (rfc6321) children to a SimpleXMLelement
     *
     * @param SimpleXMLElement $parent  a SimpleXMLelement node
     * @param string           $name    new element node name
     * @param string           $type    content type, subelement(-s) name
     * @param string           $content new subelement content
     * @param array            $params  new element 'attributes'
     * @access private
     * @static
     * @since  2.26.11 - 2019-01-02
     */
    private static function addXMLchild(
        SimpleXMLElement & $parent,
                           $name,
                           $type,
                           $content,
                           $params = []
    ) {
        static $FMTYMD       = '%04d-%02d-%02d';
        static $FMTYMDHIS    = '%04d-%02d-%02dT%02d:%02d:%02d';
        static $BOOLEAN      = 'boolean';
        static $UNTIL        = 'until';
        static $START        = 'start';
        static $END          = 'end';
        static $BEFORE       = 'before';
        static $SP0          = '';
        /** create new child node */
        $name  = strtolower( $name );
        $child = $parent->addChild( $name );
        if(( empty( $content ) && ( Util::$ZERO != $content )) ||
            ( ! is_array( $content ) && ( Util::$MINUS != $content[0] ) && ( 0 > $content ))) { // ??
            $v = $child->addChild( $type );
            return;
        }
        if( ! empty( $params )) {
            $parameters = $child->addChild( IcalXMLFactory::$PARAMETERS );
            foreach( $params as $param => $parVal ) {
                if( Vcalendar::VALUE == $param ) {
                    if( 0 != strcasecmp( $type, $parVal )) {
                        $type = strtolower( $parVal );
                    }
                    continue;
                }
                $param = strtolower( $param );
                if( StringFactory::isXprefixed( $param )) {
                    $p1 = $parameters->addChild( $param );
                    $p2 = $p1->addChild( IcalXMLFactory::$unknown, htmlspecialchars( $parVal ));
                }
                else {
                    $p1 = $parameters->addChild( $param );
                    switch( $param ) {
                        case IcalXMLFactory::$altrep :
                        case IcalXMLFactory::$dir :
                            $ptype = IcalXMLFactory::$uri;
                            break;
                        case IcalXMLFactory::$delegated_from :
                        case IcalXMLFactory::$delegated_to :
                        case IcalXMLFactory::$member :
                        case IcalXMLFactory::$sent_by :
                            $ptype = IcalXMLFactory::$cal_address;
                            break;
                        case IcalXMLFactory::$rsvp :
                            $ptype = $BOOLEAN;
                            break;
                        default :
                            $ptype = IcalXMLFactory::$text;
                            break;
                    }
                    if( is_array( $parVal )) {
                        foreach( $parVal as $pV ) {
                            $p2 = $p1->addChild( $ptype, htmlspecialchars( $pV ));
                        }
                    }
                    else {
                        $p2 = $p1->addChild( $ptype, htmlspecialchars( $parVal ));
                    }
                }
            }
        } // end if( ! empty( $params ))
        /** store content */
        switch( $type ) {
            case IcalXMLFactory::$binary :
                $v = $child->addChild( $type, $content );
                break;
            case $BOOLEAN :
                break;
            case IcalXMLFactory::$cal_address :
                $v = $child->addChild( $type, $content );
                break;
            case IcalXMLFactory::$date :
                if( array_key_exists( Util::$LCYEAR, $content )) {
                    $content = [ $content ];
                }
                foreach( $content as $date ) {
                    $str = sprintf(
                        $FMTYMD,
                        (int) $date[Util::$LCYEAR],
                        (int) $date[Util::$LCMONTH],
                        (int) $date[Util::$LCDAY]
                    );
                    $v   = $child->addChild( $type, $str );
                }
                break;
            case IcalXMLFactory::$date_time :
                if( array_key_exists( Util::$LCYEAR, $content )) {
                    $content = [ $content ];
                }
                foreach( $content as $dt ) {
                    if( ! isset( $dt[Util::$LCHOUR] )) {
                        $dt[Util::$LCHOUR] = 0;
                    }
                    if( ! isset( $dt[Util::$LCMIN] )) {
                        $dt[Util::$LCMIN] = 0;
                    }
                    if( ! isset( $dt[Util::$LCSEC] )) {
                        $dt[Util::$LCSEC] = 0;
                    }
                    $str = sprintf(
                        $FMTYMDHIS,
                        (int) $dt[Util::$LCYEAR],
                        (int) $dt[Util::$LCMONTH],
                        (int) $dt[Util::$LCDAY],
                        (int) $dt[Util::$LCHOUR],
                        (int) $dt[Util::$LCMIN],
                        (int) $dt[Util::$LCSEC]
                    );
                    if( isset( $dt[Util::$LCtz] ) && ( Vcalendar::Z == $dt[Util::$LCtz] )) {
                        $str .= Vcalendar::Z;
                    }
                    $v = $child->addChild( $type, $str );
                }
                break;
            case strtolower( Vcalendar::DURATION ) :
                $str    = DateIntervalFactory::durationArray2string( $content );
                if( isset( $content[$BEFORE ] ) && ( false != $content[$BEFORE] )) {
                    $str = Util::$MINUS . $str;
                }
                $v      = $child->addChild( $type, $str );
                break;
            case strtolower( Vcalendar::GEO ) :
                if( ! empty( $content )) {
                    $v1 = $child->addChild(
                        Vcalendar::LATITUDE,
                        GeoFactory::geo2str2( $content[Vcalendar::LATITUDE], GeoFactory::$geoLatFmt )
                    );
                    $v1 = $child->addChild(
                        Vcalendar::LONGITUDE,
                        GeoFactory::geo2str2( $content[Vcalendar::LONGITUDE], GeoFactory::$geoLongFmt ));
                }
                break;
            case IcalXMLFactory::$integer :
                $v = $child->addChild( $type, (string) $content );
                break;
            case IcalXMLFactory::$period :
                if( ! is_array( $content )) {
                    break;
                }
                foreach( $content as $period ) {
                    $v1  = $child->addChild( $type );
                    $str = sprintf(
                        $FMTYMDHIS,
                        (int) $period[0][Util::$LCYEAR],
                        (int) $period[0][Util::$LCMONTH],
                        (int) $period[0][Util::$LCDAY],
                        (int) $period[0][Util::$LCHOUR],
                        (int) $period[0][Util::$LCMIN],
                        (int) $period[0][Util::$LCSEC]
                    );
                    if( isset( $period[0][Util::$LCtz] ) && ( Vcalendar::Z == $period[0][Util::$LCtz] )) {
                        $str .= Vcalendar::Z;
                    }
                    $v2 = $v1->addChild( $START, $str );
                    if( $period[1] instanceof DateInterval ) {
                        $v2 = $v1->addChild(
                            strtolower( Vcalendar::DURATION ),
                            DateIntervalFactory::dateInterval2String( $period[1] )
                        );
                    }
                    elseif( DateTimeFactory::isArrayDate( $period[1] )) {
                        $str = sprintf(
                            $FMTYMDHIS,
                            (int) $period[1][Util::$LCYEAR],
                            (int) $period[1][Util::$LCMONTH],
                            (int) $period[1][Util::$LCDAY],
                            (int) $period[1][Util::$LCHOUR],
                            (int) $period[1][Util::$LCMIN],
                            (int) $period[1][Util::$LCSEC]
                        );
                        if( isset( $period[1][Util::$LCtz] ) && ( Vcalendar::Z == $period[1][Util::$LCtz] )) {
                            $str .= Vcalendar::Z;
                        }
                        $v2 = $v1->addChild( $END, $str );
                    }
                    else {
                        $v2 = $v1->addChild(
                            strtolower( Vcalendar::DURATION ),
                            DateIntervalFactory::durationArray2string( $period[1] )
                        );
                    }
                }
                break;
            case IcalXMLFactory::$recur :
                $content = array_change_key_case( $content );
                foreach( $content as $ruleLabel => $ruleValue ) {
                    switch( $ruleLabel ) {
                        case $UNTIL :
                            if( isset( $ruleValue[Util::$LCHOUR] )) {
                                $str = sprintf(
                                    $FMTYMDHIS,
                                    (int) $ruleValue[Util::$LCYEAR],
                                    (int) $ruleValue[Util::$LCMONTH],
                                    (int) $ruleValue[Util::$LCDAY],
                                    (int) $ruleValue[Util::$LCHOUR],
                                    (int) $ruleValue[Util::$LCMIN],
                                    (int) $ruleValue[Util::$LCSEC]
                                    ) . Vcalendar::Z;
                            }
                            else {
                                $str = sprintf(
                                    $FMTYMD,
                                    (int) $ruleValue[Util::$LCYEAR],
                                    (int) $ruleValue[Util::$LCMONTH],
                                    (int) $ruleValue[Util::$LCDAY]
                                );
                            }
                            $v = $child->addChild( $ruleLabel, $str );
                            break;
                        case IcalXMLFactory::$bysecond :
                        case IcalXMLFactory::$byminute :
                        case IcalXMLFactory::$byhour :
                        case IcalXMLFactory::$bymonthday :
                        case IcalXMLFactory::$byyearday :
                        case IcalXMLFactory::$byweekno :
                        case IcalXMLFactory::$bymonth :
                        case IcalXMLFactory::$bysetpos :
                            if( is_array( $ruleValue )) {
                                foreach( $ruleValue as $vix => $valuePart ) {
                                    $v = $child->addChild( $ruleLabel, $valuePart );
                                }
                            }
                            else {
                                $v = $child->addChild( $ruleLabel, $ruleValue );
                            }
                            break;
                        case IcalXMLFactory::$byday :
                            if( isset( $ruleValue[Vcalendar::DAY] )) {
                                $str  = ( isset( $ruleValue[0] )) ? $ruleValue[0] : null;
                                $str .= $ruleValue[Vcalendar::DAY];
                                $p    = $child->addChild( $ruleLabel, $str );
                            }
                            else {
                                foreach( $ruleValue as $valuePart ) {
                                    if( isset( $valuePart[Vcalendar::DAY] )) {
                                        $str  = ( isset( $valuePart[0] )) ? $valuePart[0] : null;
                                        $str .= $valuePart[Vcalendar::DAY];
                                        $p    = $child->addChild( $ruleLabel, $str );
                                    }
                                    else {
                                        $p = $child->addChild( $ruleLabel, $valuePart );
                                    }
                                }
                            }
                            break;
                        case IcalXMLFactory::$freq :
                        case IcalXMLFactory::$count :
                        case IcalXMLFactory::$interval :
                        case IcalXMLFactory::$wkst :
                        default:
                            $p = $child->addChild( $ruleLabel, $ruleValue );
                            break;
                    } // end switch( $ruleLabel )
                } // end foreach( $content as $ruleLabel => $ruleValue )
                break;
            case IcalXMLFactory::$rstatus :
                $v = $child->addChild(
                    IcalXMLFactory::$code,
                    number_format((float) $content[Vcalendar::STATCODE], 2, Util::$DOT, $SP0 )
                );
                $v = $child->addChild( IcalXMLFactory::$description, htmlspecialchars( $content[Vcalendar::STATDESC] ));
                if( isset( $content[Vcalendar::EXTDATA] )) {
                    $v = $child->addChild( IcalXMLFactory::$data, htmlspecialchars( $content[Vcalendar::EXTDATA] ));
                }
                break;
            case IcalXMLFactory::$text :
                if( ! is_array( $content )) {
                    $content = [ $content ];
                }
                foreach( $content as $part ) {
                    $v = $child->addChild( $type, htmlspecialchars( $part ));
                }
                break;
            case IcalXMLFactory::$time :
                break;
            case IcalXMLFactory::$uri :
                $v = $child->addChild( $type, $content );
                break;
            case IcalXMLFactory::$utc_offset :
                if( DateIntervalFactory::hasPlusMinusPrefix( $content )) {
                    $str     = $content[0];
                    $content = substr( $content, 1 );
                }
                else {
                    $str = Util::$PLUS;
                }
                $str .= substr( $content, 0, 2 ) . Util::$COLON . substr( $content, 2, 2 );
                if( 4 < strlen( $content )) {
                    $str .= Util::$COLON . substr( $content, 4 );
                }
                $v = $child->addChild( $type, $str );
                break;
            case IcalXMLFactory::$unknown :
            default:
                if( is_array( $content )) {
                    $content = implode( $content );
                }
                $v = $child->addChild( IcalXMLFactory::$unknown, htmlspecialchars( $content ));
                break;
        }
    }

    /**
     * Parse (rfc6321) XML file into iCalcreator instance
     *
     * @param  string $xmlfile
     * @param  array  $iCalcfg iCalcreator config array (opt)
     * @return mixed Vcalendar|bool (false on error)
     * @deprecated  in favor of external file content get
     * @static
     * @since  2.26.1 - 2018-12-05
     */
    public static function XMLfile2iCal( $xmlfile, $iCalcfg = [] ) {
        if( false === ( $xmlStr = file_get_contents( $xmlfile ))) {
            return false;
        }
        return IcalXMLFactory::xml2iCal( $xmlStr, $iCalcfg );
    }

    /**
     * Parse (rfc6321) XML string into iCalcreator instance, alias of XML2iCal
     *
     * @param  string $xmlStr
     * @param  array  $iCalcfg iCalcreator config array (opt)
     * @return mixed  iCalcreator instance or false on error
     * @deprecated  in favor of iCal
     * @static
     * @since  2.16.22 - 2013-06-18
     */
    public static function XMLstr2iCal( $xmlStr, $iCalcfg = [] ) {
        return IcalXMLFactory::XML2iCal( $xmlStr, $iCalcfg );
    }

    /**
     * Parse (rfc6321) XML string into iCalcreator instance
     *
     * @param  string $xmlStr
     * @param  array  $iCalcfg iCalcreator config array (opt)
     * @return mixed  iCalcreator instance or false on error
     * @static
     * @since  2.20.23 - 2017-02-25
     */
    public static function XML2iCal( $xmlStr, $iCalcfg = [] ) {
        static $CRLF = [ "\r\n", "\n\r", "\n", "\r" ];
        $xmlStr = str_replace( $CRLF, null, $xmlStr );
        $xml    = IcalXMLFactory::XMLgetTagContent1( $xmlStr, IcalXMLFactory::$Vcalendar, $endIx );
        $iCal   = new Vcalendar( $iCalcfg );
        if( false === IcalXMLFactory::XMLgetComps( $iCal, $xmlStr ))
            return false;
        return $iCal;
    }

    /**
     * Parse (rfc6321) XML string into iCalcreator components
     *
     * @param IcalInterface $iCal
     * @param string    $xml
     * @return mixed Vcalendar|bool
     * @access private
     * @static
     * @since  2.27.14 - 2019-03-09
     */
    private static function XMLgetComps(
        IcalInterface $iCal,
                      $xml
    ) {
        static $PROPSTAGempty = '<properties/>';
        static $PROPSTAGstart = '<properties>';
        static $COMPSTAGempty = '<components/>';
        static $COMPSTAGstart = '<components>';
        static $NEW      = 'new';
        static $ALLCOMPS = [
            Vcalendar::VTIMEZONE,
            Vcalendar::STANDARD,
            Vcalendar::DAYLIGHT,
            Vcalendar::VEVENT,
            Vcalendar::VTODO,
            Vcalendar::VJOURNAL,
            Vcalendar::VFREEBUSY,
            Vcalendar::VALARM
        ];
        $len = strlen( $xml );
        $sx  = 0;
        while(
            ((( $sx + 12 ) < $len ) &&
                ! StringFactory::startWith( substr( $xml, $sx ), $PROPSTAGstart ) &&
                ! StringFactory::startWith( substr( $xml, $sx ), $COMPSTAGstart )
                ) &&
            ((( $sx + 13 ) < $len ) &&
                ! StringFactory::startWith( substr( $xml, $sx ), $PROPSTAGempty ) &&
                ! StringFactory::startWith( substr( $xml, $sx ), $COMPSTAGempty ))) {
            $sx += 1;
        }
        if(( $sx + 11 ) >= $len ) {
            return false;
        }
        if( StringFactory::startWith( $xml, $PROPSTAGempty, $pos )) {
            $xml = substr( $xml, $pos );
        }
        elseif( StringFactory::startWith( substr( $xml, $sx ), $PROPSTAGstart )) {
            $xml2 = IcalXMLFactory::XMLgetTagContent1( $xml, IcalXMLFactory::$properties, $endIx );
            IcalXMLFactory::XMLgetProps( $iCal, $xml2 );
            $xml = substr( $xml, $endIx );
        }
        if( StringFactory::startWith( $xml, $COMPSTAGempty, $pos )) {
            $xml = substr( $xml, $pos );
        }
        elseif( StringFactory::startWith( $xml, $COMPSTAGstart )) {
            $xml = IcalXMLFactory::XMLgetTagContent1( $xml, IcalXMLFactory::$components, $endIx );
        }
        while( ! empty( $xml )) {
            $xml2 = IcalXMLFactory::XMLgetTagContent2( $xml, $tagName, $endIx );
            $newCompMethod = $NEW . ucfirst( strtolower( $tagName ));
            if( Util::isCompInList( $tagName, $ALLCOMPS )) {
                $iCalComp = $iCal->{$newCompMethod}();
                IcalXMLFactory::XMLgetComps( $iCalComp, $xml2 );
            }
            $xml = substr( $xml, $endIx );
        } // end while( ! empty( $xml ))
        return $iCal;
    }

    /**
     * Parse (rfc6321) XML into iCalcreator properties
     *
     * @param  IcalInterface $iCalComp iCalcreator calendar/component instance
     * @param  string        $xml
     * @access private
     * @static
     * @since  2.27.14 - 2019-03-08
     */
    private static function XMLgetProps( IcalInterface $iCalComp, $xml ) {
        static $VERSIONPRODID   = null;
        static $PARAMENDTAG     = '<parameters/>';
        static $PARAMTAG        = '<parameters>';
        static $DATETAGST       = '<date';
        static $PERIODTAG       = '<period>';
        static $ATTENDEEPARKEYS    = [ Vcalendar::DELEGATED_FROM, Vcalendar::DELEGATED_TO, Vcalendar::MEMBER ];
        if( is_null( $VERSIONPRODID )) {
            $VERSIONPRODID = [
                Vcalendar::VERSION,
                Vcalendar::PRODID,
            ];
        }
        while( ! empty( $xml )) {
            $xml2     = IcalXMLFactory::XMLgetTagContent2( $xml, $propName, $endIx );
            $propName = strtoupper( $propName );
            if( empty( $xml2 ) && ( Util::$ZERO != $xml2 )) {
                if( StringFactory::isXprefixed( $propName )) {
                    $iCalComp->setXprop( $propName );
                }
                else {
                    $method = Vcalendar::getSetMethodName( $propName );
                    $iCalComp->{$method}();
                }
                $xml = substr( $xml, $endIx );
                continue;
            }
            $params = [];
            if( StringFactory::startWith( $xml2, $PARAMENDTAG, $pos )) {
                $xml2 = substr( $xml2, 13 );
            }
            elseif( StringFactory::startWith( $xml2, $PARAMTAG )) {
                $xml3 = IcalXMLFactory::XMLgetTagContent1( $xml2, IcalXMLFactory::$PARAMETERS, $endIx2 );
                $endIx3 = 0;
                while( ! empty( $xml3 )) {
                    $xml4     = IcalXMLFactory::XMLgetTagContent2( $xml3, $paramKey, $endIx3 );
                    $pType    = false; // skip parameter valueType
                    $paramKey = strtoupper( $paramKey );
                    if( in_array( $paramKey, $ATTENDEEPARKEYS )) {
                        while( ! empty( $xml4 )) {
                            $paramValue = IcalXMLFactory::XMLgetTagContent1( $xml4, IcalXMLFactory::$cal_address, $endIx4 );
                            if( ! isset( $params[$paramKey] )) {
                                $params[$paramKey] = [ $paramValue ];
                            }
                            else {
                                $params[$paramKey][] = $paramValue;
                            }
                            $xml4 = substr( $xml4, $endIx4 );
                        }
                    } // end if( in_array( $paramKey, Util::$ATTENDEEPARKEYS ))
                    else {
                        $paramValue = html_entity_decode(
                            IcalXMLFactory::XMLgetTagContent2(
                                $xml4,
                                $pType,
                                $endIx4
                            )
                        );
                        if( ! isset( $params[$paramKey] )) {
                            $params[$paramKey] = $paramValue;
                        }
                        else {
                            $params[$paramKey] .= Util::$COMMA . $paramValue;
                        }
                    }
                    $xml3 = substr( $xml3, $endIx3 );
                }
                $xml2 = substr( $xml2, $endIx2 );
            } // end elseif - parameters
            $valueType = false;
            $value     = ( ! empty( $xml2 ) || ( Util::$ZERO == $xml2 ))
                ? IcalXMLFactory::XMLgetTagContent2( $xml2, $valueType, $endIx3 ) : null;
            switch( $propName ) {
                case Vcalendar::CATEGORIES :
                // fall through
                case Vcalendar::RESOURCES :
                    $tValue = [];
                    while( ! empty( $xml2 )) {
                        $tValue[] = html_entity_decode(
                            IcalXMLFactory::XMLgetTagContent2(
                                $xml2,
                                $valueType,
                                $endIx4
                            )
                        );
                        $xml2     = substr( $xml2, $endIx4 );
                    }
                    $value = $tValue;
                    break;
                case Vcalendar::EXDATE :   // multiple single-date(-times) may exist
                // fall through
                case Vcalendar::RDATE :
                    if( IcalXMLFactory::$period != $valueType ) {
                        if( IcalXMLFactory::$date == $valueType ) {
                            $params[Vcalendar::VALUE] = Vcalendar::DATE;
                        }
                        $t = [];
                        while( ! empty( $xml2 ) &&
                            ( StringFactory::startWith( $xml2, $DATETAGST ))) {
                            $t[]  = IcalXMLFactory::XMLgetTagContent2( $xml2, $pType, $endIx4);
                            $xml2 = substr( $xml2, $endIx4 );
                        }
                        $value = $t;
                        break;
                    }
                case Vcalendar::FREEBUSY :
                    if( Vcalendar::RDATE == $propName ) {
                        $params[Vcalendar::VALUE] = Vcalendar::PERIOD;
                    }
                    $value = [];
                    while( ! empty( $xml2 ) &&
                        ( StringFactory::startWith( $xml2, $PERIODTAG ))) {
                        $xml3 = IcalXMLFactory::XMLgetTagContent1( $xml2, IcalXMLFactory::$period, $endIx4);
                        $t    = [];
                        while( ! empty( $xml3 )) { // start - end/duration
                            $t[]  = IcalXMLFactory::XMLgetTagContent2( $xml3, $pType, $endIx5 );
                            $xml3 = substr( $xml3, $endIx5 );
                        }
                        $value[] = $t;
                        $xml2    = substr( $xml2, $endIx4 );
                    }
                    break;
                case Vcalendar::TZOFFSETTO :
                // fall through
                case Vcalendar::TZOFFSETFROM :
                    $value = str_replace( Util::$COLON, null, $value );
                    break;
                case Vcalendar::GEO :
                    $tValue                       = [ Vcalendar::LATITUDE => $value ];
                    $tValue[Vcalendar::LONGITUDE] = IcalXMLFactory::XMLgetTagContent1(
                        substr( $xml2, $endIx3 ),
                        Vcalendar::LONGITUDE,
                        $endIx3
                    );
                    $value = $tValue;
                    break;
                case Vcalendar::EXRULE :
                // fall through
                case Vcalendar::RRULE :
                    $tValue    = [ $valueType => $value ];
                    $xml2      = substr( $xml2, $endIx3 );
                    $valueType = false;
                    while( ! empty( $xml2 )) {
                        $t = IcalXMLFactory::XMLgetTagContent2( $xml2, $valueType, $endIx4 );
                        switch( strtoupper( $valueType )) {
                            case Vcalendar::FREQ :
                            case Vcalendar::COUNT :
                            case Vcalendar::UNTIL :
                            case Vcalendar::INTERVAL :
                            case Vcalendar::WKST :
                                $tValue[$valueType] = $t;
                                break;
                            case Vcalendar::BYDAY :
                                if( 2 == strlen( $t )) {
                                    $tValue[$valueType][] = [ Vcalendar::DAY => $t ];
                                }
                                else {
                                    $day = substr( $t, -2 );
                                    $key = substr( $t, 0, ( strlen( $t ) - 2 ));
                                    $tValue[$valueType][] = [ $key, Vcalendar::DAY => $day ];
                                }
                                break;
                            default:
                                $tValue[$valueType][] = $t;
                        }
                        $xml2 = substr( $xml2, $endIx4 );
                    }
                    $value = $tValue;
                    break;
                case Vcalendar::REQUEST_STATUS :
                    $tValue = [];
                    while( ! empty( $xml2 )) {
                        $t    = html_entity_decode(
                            IcalXMLFactory::XMLgetTagContent2(
                                $xml2,
                                $valueType,
                                $endIx4 )
                        );
                        $tValue[$valueType] = $t;
                        $xml2 = substr( $xml2, $endIx4 );
                    }
                    if( ! empty( $tValue )) {
                        $value = $tValue;
                    }
                    else {
                        $value = [
                            IcalXMLFactory::$code        => null,
                            IcalXMLFactory::$description => null,
                        ];
                    }
                    break;
                default:
                    switch( $valueType ) {
                        case IcalXMLFactory::$binary :
                            $params[Vcalendar::VALUE] = Vcalendar::BINARY;
                            break;
                        case IcalXMLFactory::$date :
                            $params[Vcalendar::VALUE] = Vcalendar::DATE;
                            break;
                        case IcalXMLFactory::$date_time :
                            $params[Vcalendar::VALUE] = Vcalendar::DATE_TIME;
                            break;
                        case IcalXMLFactory::$text :
                            // fall through
                        case IcalXMLFactory::$unknown :
                            $value = html_entity_decode( $value );
                            break;
                        default :
                            if( StringFactory::isXprefixed( $propName ) &&
                                ( IcalXMLFactory::$unknown != strtolower( $valueType ))) {
                                $params[Vcalendar::VALUE] = strtoupper( $valueType );
                            }
                            break;
                    }
                    break;
            } // end switch( $propName )
            $method = Vcalendar::getSetMethodName( $propName );
            switch( true ) {
                case ( Util::isPropInList( $propName, $VERSIONPRODID )) :
                    break;
                case ( StringFactory::isXprefixed( $propName )) :
                    $iCalComp->setXprop( $propName, $value, $params );
                    break;
                case ( Vcalendar::FREEBUSY == $propName ) :
                    $fbtype = ( isset( $params[Vcalendar::FBTYPE] )) ? $params[Vcalendar::FBTYPE] : null;
                    unset( $params[Vcalendar::FBTYPE] );
                    $iCalComp->{$method}( $fbtype, $value, $params );
                    break;
                case ( Vcalendar::GEO == $propName ) :
                    $iCalComp->{$method}(
                        $value[Vcalendar::LATITUDE],
                        $value[Vcalendar::LONGITUDE],
                        $params
                    );
                    break;
                case ( Vcalendar::REQUEST_STATUS == $propName ) :
                    if( ! isset( $value[IcalXMLFactory::$data] )) {
                        $value[IcalXMLFactory::$data] = false;
                    }
                    $iCalComp->{$method}(
                        $value[IcalXMLFactory::$code],
                        $value[IcalXMLFactory::$description],
                        $value[IcalXMLFactory::$data],
                        $params
                    );
                    break;
                default :
                    if( empty( $value ) && ( is_array( $value ) || ( Util::$ZERO > $value ))) {
                        $value = null;
                    }
                    $iCalComp->{$method}( $value, $params );
                    break;
            }
            $xml = substr( $xml, $endIx );
        } // end while( ! empty( $xml ))
    }

    /**
     * Fetch a specific XML tag content
     *
     * @param string $xml
     * @param string $tagName
     * @param int    $endIx
     * @return mixed
     * @access private
     * @static
     * @since  2.23.8 - 2017-04-17
     */
    private static function XMLgetTagContent1( $xml, $tagName, & $endIx = 0 ) {
        static $FMT0 = '<%s>';
        static $FMT1 = '<%s />';
        static $FMT2 = '<%s/>';
        static $FMT3 = '</%s>';
        $tagName = strtolower( $tagName );
        $strLen  = strlen( $tagName );
        $xmlLen  = strlen( $xml );
        $sx1     = 0;
        while( $sx1 < $xmlLen ) {
            if((( $sx1 + $strLen + 1 ) < $xmlLen ) &&
                ( sprintf( $FMT0, $tagName ) == strtolower( substr( $xml, $sx1, ( $strLen + 2 ))))) {
                break;
            }
            if((( $sx1 + $strLen + 3 ) < $xmlLen ) &&
                ( sprintf( $FMT1, $tagName ) == strtolower( substr( $xml, $sx1, ( $strLen + 4 ))))) {
                $endIx = $strLen + 5;
                return null; // empty tag
            }
            if((( $sx1 + $strLen + 2 ) < $xmlLen ) &&
                ( sprintf( $FMT2, $tagName ) == strtolower( substr( $xml, $sx1, ( $strLen + 3 ))))) {
                $endIx = $strLen + 4;
                return null; // empty tag
            }
            $sx1 += 1;
        } // end while...
        if( false === substr( $xml, $sx1, 1 )) {
            $endIx = ( empty( $sx )) ? 0 : $sx - 1; // ??
            return null;
        }
        $endTag = sprintf( $FMT3, $tagName );
        if( false === ( $pos = stripos( $xml, $endTag ))) { // missing end tag??
            $endIx = $xmlLen + 1;
            return null;
        }
        $endIx = $pos + $strLen + 3;
        return substr( $xml, ( $sx1 + $strLen + 2 ), ( $pos - $sx1 - 2 - $strLen ));
    }

    /**
     * Fetch next (unknown) XML tagname AND content
     *
     * @param string $xml
     * @param string $tagName
     * @param int    $endIx
     * @return mixed
     * @access private
     * @static
     * @since  2.23.8 - 2017-04-17
     */
    private static function XMLgetTagContent2( $xml, & $tagName, & $endIx ) {
        static $LT          = '<';
        static $CMTSTART    = '<!--';
        static $EMPTYTAGEND = '/>';
        static $GT          = '>';
        static $DURATION    = 'duration';
        static $DURATIONTAG = '<duration>';
        static $DURENDTAG   = '</duration>';
        static $FMTTAG      = '</%s>';
        $xmlLen = strlen( $xml );
        $endIx  = $xmlLen + 1; // just in case.. .
        $sx1    = 0;
        while( $sx1 < $xmlLen ) {
            if( $LT == substr( $xml, $sx1, 1 )) {
                if((( $sx1 + 3 ) < $xmlLen ) &&
                    ( StringFactory::startWith( substr( $xml, $sx1 ), $CMTSTART ))
                ) { // skip comment
                    $sx1 += 1;
                }
                else {
                    break;
                } // tagname start here
            }
            else {
                $sx1 += 1;
            }
        } // end while...
        $sx2 = $sx1;
        while( $sx2 < $xmlLen ) {
            if((( $sx2 + 1 ) < $xmlLen ) &&
                ( StringFactory::startWith( substr( $xml, $sx2 ), $EMPTYTAGEND ))
            ) { // tag with no content
                $tagName = trim( substr( $xml, ( $sx1 + 1 ), ( $sx2 - $sx1 - 1 )));
                $endIx   = $sx2 + 2;
                return null;
            }
            if( $GT == substr( $xml, $sx2, 1 )) // tagname ends here
            {
                break;
            }
            $sx2 += 1;
        } // end while...
        $tagName = substr( $xml, ( $sx1 + 1 ), ( $sx2 - $sx1 - 1 ));
        $endIx   = $sx2 + 1;
        if( $sx2 >= $xmlLen ) {
            return null;
        }
        $strLen = strlen( $tagName );
        if(( $DURATION == $tagName ) &&
            ( false !== ( $pos1 = stripos( $xml, $DURATIONTAG, $sx1 + 1 ))) &&
            ( false !== ( $pos2 = stripos( $xml, $DURENDTAG,  $pos1 + 1 ))) &&
            ( false !== ( $pos3 = stripos( $xml, $DURENDTAG,  $pos2 + 1 ))) &&
            ( $pos1 < $pos2 ) && ( $pos2 < $pos3 )) {
            $pos = $pos3;
        }
        elseif( false === ( $pos = stripos( $xml, sprintf( $FMTTAG, $tagName ), $sx2 ))) {
            return null;
        }
        $endIx = $pos + $strLen + 3;
        return substr( $xml, ( $sx1 + $strLen + 2 ), ( $pos - $strLen - 2 ));
    }
}

