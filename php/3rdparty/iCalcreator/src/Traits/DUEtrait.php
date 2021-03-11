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

namespace Kigkonsult\Icalcreator\Traits;

use Kigkonsult\Icalcreator\Util\StringFactory;
use Kigkonsult\Icalcreator\Util\Util;
use Kigkonsult\Icalcreator\Util\DateTimeFactory;
use Kigkonsult\Icalcreator\Util\ParameterFactory;
use InvalidArgumentException;

use function is_array;

/**
 * DUE property functions
 *
 * @author Kjell-Inge Gustafsson, kigkonsult <ical@kigkonsult.se>
 * @since 2.27.14 2019-01-28
 */
trait DUEtrait
{
    /**
     * @var array component property DUE value
     * @access protected
     */
    protected $due = null;

    /**
     * Return formatted output for calendar component property due
     *
     * "The value type of the "DTEND" or "DUE" properties MUST match the value type of "DTSTART" property."
     * @return string
     * @since  2.27.12 - 2019-01-09
     */
    public function createDue() {
        if( empty( $this->due )) {
            return null;
        }
        if( DateTimeFactory::hasNoDate( $this->due )) {
            return ( $this->getConfig( self::ALLOWEMPTY )) ? StringFactory::createElement( self::DUE ) : null;
        }
        if( ! empty( $this->dtstart )) {
            $parNo = ParameterFactory::isParamsValueSet( $this->dtstart, self::DATE ) ? 3 : null;
        }
        else {
            $parNo = ParameterFactory::isParamsValueSet( $this->due, self::DATE ) ? 3 : null;
        }
        return StringFactory::createElement(
            self::DUE,
            ParameterFactory::createParams( $this->due[Util::$LCparams] ),
            DateTimeFactory::dateArrayToStr(
                $this->due[Util::$LCvalue],
                ParameterFactory::isParamsValueSet( $this->due, self::DATE )
            )
        );
    }

    /**
     * Delete calendar component property due
     *
     * @return bool
     * @since  2.27.1 - 2018-12-15
     */
    public function deleteDue( ) {
        $this->due = null;
        return true;
    }

    /**
     * Get calendar component property due
     *
     * @param bool   $inclParam
     * @return bool|array
     * @since  2.27.1 - 2018-12-12
     */
    public function getDue( $inclParam = false ) {
        if( empty( $this->due )) {
            return false;
        }
        return ( $inclParam ) ? $this->due : $this->due[Util::$LCvalue];
    }

    /**
     * Set calendar component property due
     *
     * @param mixed  $value
     * @param mixed  $month
     * @param int    $day
     * @param int    $hour
     * @param int    $min
     * @param int    $sec
     * @param string $tz
     * @param array  $params
     * @return static
     * @throws InvalidArgumentException
     * @since 2.27.14 2019-02-10
     */
    public function setDue(
        $value  = null,
        $month  = null,
        $day    = null,
        $hour   = null,
        $min    = null,
        $sec    = null,
        $tz     = null,
        $params = null
    ) {
        if( empty( $value )) {
            $this->assertEmptyValue( $value, self::DUE );
            $this->due = [
                Util::$LCvalue  => Util::$SP0,
                Util::$LCparams => [],
            ];
            return $this;
        }
        if( DateTimeFactory::isArgsDate( $value, $month, $day )) {
            $value = DateTimeFactory::argsToStr( $value, $month, $day, $hour, $min, $sec, $tz );
            if( is_array( $params )) {
                $month = $params;
            }
            else {
                $month = ( is_array( $hour )) ? $hour : [];
            }
        }
        elseif( ! is_array( $month )) {
            $month = [];
        }
        $dtstart = $this->getDtstart( true );
        if( isset( $dtstart[Util::$LCparams][self::VALUE] )) {
            $month[self::VALUE] = $dtstart[Util::$LCparams][self::VALUE];
        }
        $this->due = DateTimeFactory::setDate(
            $value,
            ParameterFactory::setParams( $month, DateTimeFactory::$DEFAULTVALUEDATETIME )
        );
        if( ! empty( $dtstart ) && Util::issetAndNotEmpty( $dtstart, Util::$LCvalue )) {
            DateTimeFactory::assertYmdArgsAsDatesAreInSequence( $dtstart, $this->due, self::DUE );
        }
        return $this;
    }
}
