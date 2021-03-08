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

use Kigkonsult\Icalcreator\Util\Util;
use Kigkonsult\Icalcreator\Util\RexdateFactory;
use Kigkonsult\Icalcreator\Util\DateTimeFactory;
use Kigkonsult\Icalcreator\Util\DateIntervalFactory;
use Kigkonsult\Icalcreator\Util\ParameterFactory;
use DateTime;
use InvalidArgumentException;
use Exception;

use function count;
use function is_array;
use function is_string;
use function reset;

/**
 * RDATE property functions
 *
 * @author Kjell-Inge Gustafsson, kigkonsult <ical@kigkonsult.se>
 * @throws InvalidArgumentException
 * @throws Exception
 * @since 2.27.3 2018-12-22
 */
trait RDATEtrait
{
    /**
     * @var array component property RDATE value
     * @access protected
     */
    protected $rdate = null;

    /**
     * Return formatted output for calendar component property rdate
     *
     * @return string
     * @throws Exception
     */
    public function createRdate() {
        if( empty( $this->rdate )) {
            return null;
        }
        try {
            $res = RexdateFactory::formatRdate(
                $this->rdate,
                $this->getConfig( self::ALLOWEMPTY ),
                $this->getCompType()
            );
        }
        catch( Exception $e ) {
            throw $e;
        }
        return $res;
    }

    /**
     * Delete calendar component property rdate
     *
     * @param int   $propDelIx   specific property in case of multiply occurrence
     * @return bool
     * @since  2.27.1 - 2018-12-15
     */
    public function deleteRdate( $propDelIx = null ) {
        if( empty( $this->rdate )) {
            unset( $this->propDelIx[self::RDATE] );
            return false;
        }
        return $this->deletePropertyM( $this->rdate, self::RDATE, $propDelIx );
    }

    /**
     * Get calendar component property rdate
     *
     * @param int    $propIx specific property in case of multiply occurrence
     * @param bool   $inclParam
     * @return bool|array
     * @throws Exception
     * @since  2.27.2 - 2018-12-19
     */
    public function getRdate( $propIx = null, $inclParam = false ) {
        if( empty( $this->rdate )) {
            unset( $this->propIx[self::RDATE] );
            return false;
        }
        $output = $this->getPropertyM( $this->rdate, self::RDATE, $propIx, $inclParam );
        if( empty( $output )) {
            return false;
        }
        if( empty( $output[Util::$LCvalue] )) {
            return $output;
        }
        if( isset( $output[Util::$LCvalue] )) {
            foreach( $output[Util::$LCvalue] as $rIx => $rdatePart ) {
                if( isset( $rdatePart[1]['invert'] )) { // fix pre 7.0.5 bug
                    try {
                        $dateInterval = DateIntervalFactory::DateIntervalArr2DateInterval( $rdatePart[1] );
                    }
                    catch( Exception $e ) {
                        throw $e;
                    }
                    $output[Util::$LCvalue][$rIx][1] = DateIntervalFactory::dateInterval2arr( $dateInterval );
                    if( isset( $output[Util::$LCvalue][$rIx][1][Util::$LCWEEK] ) &&
                        empty( $output[Util::$LCvalue][$rIx][1][Util::$LCWEEK] )) {
                        unset( $output[Util::$LCvalue][$rIx][1][Util::$LCWEEK] );
                    }
                }
            }
        }
        else {
            foreach( $output as $rIx => $rdatePart ) {
                if( isset( $rdatePart[1]['invert'] )) { // fix pre 7.0.5 bug
                    try {
                        $dateInterval = DateIntervalFactory::DateIntervalArr2DateInterval( $rdatePart[1] );
                    }
                    catch( Exception $e ) {
                        throw $e;
                    }
                    $output[$rIx][1] = DateIntervalFactory::dateInterval2arr( $dateInterval );
                    if( isset( $output[$rIx][1][Util::$LCWEEK] ) &&
                        empty( $output[$rIx][1][Util::$LCWEEK] )) {
                        unset( $output[$rIx][1][Util::$LCWEEK] );
                    }
                }
            }
        }
        return $output;
    }

    /**
     * Set calendar component property rdate
     *
     * @param array   $value
     * @param array   $params
     * @param integer $index
     * @return static
     * @throws InvalidArgumentException
     * @throws Exception
     * @since 2.27.3 2019-01-06
     */
    public function setRdate( $value = null, $params = null, $index = null ) {
        if( empty( $value ) || ( is_array( $value) && ( 1 == count( $value )) && empty( reset( $value )))) {
            $this->assertEmptyValue( $value, self::RDATE );
            $this->setMval( $this->rdate, Util::$SP0, [], null, $index );
            return $this;
        }
        $value = self::checkSingleRdates(
            $value,
            ParameterFactory::isParamsValueSet( [ Util::$LCparams => $params ], self::PERIOD )
        );
        try {
            $input = RexdateFactory::prepInputRdate( $value, $params, $this->getCompType());
        }
        catch( Exception $e ) {
            throw $e;
        }
        $this->setMval( $this->rdate, $input[Util::$LCvalue], $input[Util::$LCparams], null, $index );
        return $this;
    }

    /**
     * Return Rdates is single input
     *
     * @param array $rDates
     * @param bool $isPeriod
     * @return array
     * @access private
     * @static
     * @since 2.27.3 2019-01-06
     */
    private static function checkSingleRdates( $rDates, $isPeriod ) {
        if( $rDates instanceof DateTime ) {
            return [ $rDates ];
        }
        if(DateTimeFactory::isStringAndDate( $rDates )) {
            return [ $rDates ];
        }
        if( is_array( $rDates ) && ! $isPeriod ) {
            $first = array_change_key_case( $rDates );
            if( isset( $first[Util::$LCYEAR] ) || isset( $first[Util::$LCTIMESTAMP] )) {
                return [ $rDates ];
            }
            if( isset( $rDates[0] ) && isset( $rDates[1] ) && isset( $rDates[2] ) &&
                is_scalar( $rDates[0] ) && is_scalar( $rDates[1] ) && is_scalar( $rDates[2] ) &&
                DateTimeFactory::isArgsDate( $rDates[0], $rDates[1], $rDates[2] )) {
                return [ $rDates ];
            }
            if( isset( $first[0] ) && is_scalar( $first[0] ) && ( false === strtotime( $first[0] ))) {
                return [ $rDates ]; // what comes here ??
            }
            return $rDates;
        }
        if( $isPeriod && is_array( $rDates ) && ( 2 == count( $rDates ))) {
            $first = reset( $rDates );
            if(( $first instanceof DateTime ) || is_string( $first )) {
                return [ $rDates ];
            }
            if( ! is_array( $first )) {
                return $rDates;
            }
            if( isset( $first[0] ) && isset( $first[1] ) && isset( $first[2] ) &&
                DateTimeFactory::isArgsDate( $first[0], $first[1], $first[2] )) {
                return [ $rDates ];
            }
            $first = array_change_key_case( $first );
            if( isset( $first[Util::$LCYEAR] ) || isset( $first[Util::$LCTIMESTAMP] )) {
                return [ $rDates ];
            }
            if( isset( $first[0] ) && is_int($first[0] )) {
                $rDates = [ $rDates ]; // ??
            }
        }
        return $rDates;
    }
}
