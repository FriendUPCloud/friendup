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

/**
 * TZNAME property functions
 *
 * @author Kjell-Inge Gustafsson, kigkonsult <ical@kigkonsult.se>
return $this;
 */
trait TZNAMEtrait
{
    /**
     * @var array component property TZNAME value
     * @access protected
     */
    protected $tzname = null;

    /**
     * Return formatted output for calendar component property tzname
     *
     * @return string
     */
    public function createTzname() {
        if( empty( $this->tzname )) {
            return null;
        }
        $output = null;
        $lang   = $this->getConfig( self::LANGUAGE );
        foreach( $this->tzname as $tzx => $theName ) {
            if( ! empty( $theName[Util::$LCvalue] )) {
                $output .= StringFactory::createElement(
                    self::TZNAME,
                    ParameterFactory::createParams( $theName[Util::$LCparams], [ self::LANGUAGE ], $lang ),
                    StringFactory::strrep( $theName[Util::$LCvalue] )
                );
            }
            elseif( $this->getConfig( self::ALLOWEMPTY )) {
                $output .= StringFactory::createElement( self::TZNAME );
            }
        }
        return $output;
    }

    /**
     * Delete calendar component property tzname
     *
     * @param int   $propDelIx   specific property in case of multiply occurrence
     * @return bool
     * @since  2.27.1 - 2018-12-15
     */
    public function deleteTzname( $propDelIx = null ) {
        if( empty( $this->tzname )) {
            unset( $this->propDelIx[self::TZNAME] );
            return false;
        }
        return $this->deletePropertyM( $this->tzname, self::TZNAME, $propDelIx );
    }

    /**
     * Get calendar component property tzname
     *
     * @param int    $propIx specific property in case of multiply occurrence
     * @param bool   $inclParam
     * @return bool|array
     * @since  2.27.1 - 2018-12-12
     */
    public function getTzname( $propIx = null, $inclParam = false ) {
        if( empty( $this->tzname )) {
            unset( $this->propIx[self::TZNAME] );
            return false;
        }
        return $this->getPropertyM( $this->tzname, self::TZNAME, $propIx, $inclParam );
    }

    /**
     * Set calendar component property tzname
     *
     * @param string  $value
     * @param array   $params
     * @param integer $index
     * @return static
     * @throws InvalidArgumentException
     * @since 2.27.3 2018-12-22
     */
    public function setTzname( $value = null, $params = null, $index = null ) {
        if( empty( $value )) {
            $this->assertEmptyValue( $value, self::TZNAME );
            $value  = Util::$SP0;
            $params = [];
        }
        $this->setMval( $this->tzname, StringFactory::trimTrailNL( $value ), $params, null, $index );
        return $this;
    }
}
