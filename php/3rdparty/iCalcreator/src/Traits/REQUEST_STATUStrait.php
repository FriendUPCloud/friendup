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
use Kigkonsult\Icalcreator\Util\ParameterFactory;
use InvalidArgumentException;

use function number_format;
use function floatval;
use function filter_var;
use function sprintf;
use function var_export;

/**
 * REQUEST-STATUS property functions
 *
 * @author Kjell-Inge Gustafsson, kigkonsult <ical@kigkonsult.se>
 * @since 2.27.14 2019-02-20
 */
trait REQUEST_STATUStrait
{
    /**
     * @var array component property REQUEST-STATUS value
     * @access protected
     */
    protected $requeststatus = null;

    /**
     * Return formatted output for calendar component property request-status
     *
     * @return string
     * @since 2.27.14 2019-02-20
     */
    public function createRequestStatus() {
        if( empty( $this->requeststatus )) {
            return null;
        }
        $output = null;
        $lang   = $this->getConfig( self::LANGUAGE );
        foreach( $this->requeststatus as $rx => $rStat ) {
            if( empty( $rStat[Util::$LCvalue][self::STATCODE] )) {
                if( $this->getConfig( self::ALLOWEMPTY )) {
                    $output .= StringFactory::createElement( self::REQUEST_STATUS );
                }
                continue;
            }
            $content =
                $rStat[Util::$LCvalue][self::STATCODE] .
                Util::$SEMIC .
                StringFactory::strrep( $rStat[Util::$LCvalue][self::STATDESC] );
            if( isset( $rStat[Util::$LCvalue][self::EXTDATA] )) {
                $content .= Util::$SEMIC . StringFactory::strrep( $rStat[Util::$LCvalue][self::EXTDATA] );
            }
            $output .= StringFactory::createElement(
                self::REQUEST_STATUS,
                ParameterFactory::createParams( $rStat[Util::$LCparams], [ self::LANGUAGE ], $lang ),
                $content
            );
        }
        return $output;
    }

    /**
     * Delete calendar component property request-status
     *
     * @param int   $propDelIx   specific property in case of multiply occurrence
     * @return bool
     * @since  2.27.1 - 2018-12-15
     */
    public function deleteRequeststatus( $propDelIx = null ) {
        if( empty( $this->requeststatus )) {
            unset( $this->propDelIx[self::REQUEST_STATUS] );
            return false;
        }
        return $this->deletePropertyM( $this->requeststatus, self::REQUEST_STATUS, $propDelIx );
    }

    /**
     * Get calendar component property request-status
     *
     * @param int    $propIx specific property in case of multiply occurrence
     * @param bool   $inclParam
     * @return bool|array
     * @since  2.27.1 - 2018-12-12
     */
    public function getRequestStatus( $propIx = null, $inclParam = false ) {
        if( empty( $this->requeststatus )) {
            unset( $this->propIx[self::REQUEST_STATUS] );
            return false;
        }
        return $this->getPropertyM( $this->requeststatus, self::REQUEST_STATUS, $propIx, $inclParam );
    }

    /**
     * Set calendar component property request-status
     *
     * @param float   $statCode 1*DIGIT 1*2("." 1*DIGIT)
     * @param string  $text
     * @param string  $extData
     * @param array   $params
     * @param integer $index
     * @return static
     * @throws InvalidArgumentException
     * @since 2.27.14 2019-02-20
     */
    public function setRequestStatus(
        $statCode = null,
        $text     = null,
        $extData  = null,
        $params   = null,
        $index    = null
    ) {
        static $ERR = 'Invalid %s status code value %s';
        if( empty( $statCode ) || empty( $text )) {
            $this->assertEmptyValue( Util::$SP0, self::REQUEST_STATUS );
            $statCode = $text = Util::$SP0;
            $params = [];
        }
        elseif( ! is_numeric( $statCode ) ||
            ( floatval( $statCode ) != filter_var( $statCode, FILTER_VALIDATE_FLOAT ))) {
            throw new InvalidArgumentException(
                sprintf( $ERR, self::REQUEST_STATUS, var_export( $statCode, true ))
            );
        }
        $input = [
            self::STATCODE => number_format( (float) $statCode, 2, Util::$DOT, null ),
            self::STATDESC => StringFactory::trimTrailNL( $text ),
        ];
        if( ! empty( $extData )) {
            $input[self::EXTDATA] = StringFactory::trimTrailNL( $extData );
        }
        $this->setMval( $this->requeststatus, $input, $params, null, $index );
        return $this;
    }
}
