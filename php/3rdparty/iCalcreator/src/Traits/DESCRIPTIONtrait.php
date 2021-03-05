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

use function is_bool;

/**
 * DESCRIPTION property functions
 *
 * @author Kjell-Inge Gustafsson, kigkonsult <ical@kigkonsult.se>
 * @since 2.27.3 2018-12-22
 */
trait DESCRIPTIONtrait
{
    /**
     * @var array component property DESCRIPTION value
     * @access protected
     */
    protected $description = null;

    /**
     * Return formatted output for calendar component property description
     *
     * @return string
     */
    public function createDescription() {
        if( empty( $this->description )) {
            return null;
        }
        $output = null;
        $lang   = $this->getConfig( self::LANGUAGE );
        foreach( $this->description as $dx => $description ) {
            if( ! empty( $description[Util::$LCvalue] )) {
                $output .= StringFactory::createElement(
                    self::DESCRIPTION,
                    ParameterFactory::createParams( $description[Util::$LCparams], self::$ALTRPLANGARR, $lang ),
                    StringFactory::strrep( $description[Util::$LCvalue] )
                );
            }
            elseif( $this->getConfig( self::ALLOWEMPTY )) {
                $output .= StringFactory::createElement( self::DESCRIPTION );
            }
        }
        return $output;
    }

    /**
     * Delete calendar component property description
     *
     * @param int   $propDelIx   specific property in case of multiply occurrence
     * @return bool
     * @since  2.27.1 - 2018-12-15
     */
    public function deleteDescription( $propDelIx = null ) {
        if( empty( $this->description )) {
            unset( $this->propDelIx[self::DESCRIPTION] );
            return false;
        }
        return $this->deletePropertyM( $this->description, self::DESCRIPTION, $propDelIx );
    }

    /**
     * Get calendar component property description
     *
     * @param bool|int  $propIx specific property in case of multiply occurrence
     * @param bool      $inclParam
     * @return bool|array
     * @since  2.27.1 - 2018-12-17
     */
    public function getDescription( $propIx = null, $inclParam = null ) {
        if( empty( $this->description )) {
            unset( $this->propIx[self::DESCRIPTION] );
            return false;
        }
        if( self::VJOURNAL != $this->getCompType()) {
            if( ! is_bool( $inclParam )) {
                $inclParam = ( true == $propIx ) ? true : false; // note ==
            }
            $propIx = null;
        }
        return $this->getPropertyM( $this->description, self::DESCRIPTION, $propIx, $inclParam );
    }

    /**
     * Set calendar component property description
     *
     * @param string  $value
     * @param array   $params
     * @param integer $index
     * @return static
     * @throws InvalidArgumentException
     * @since 2.27.3 2018-12-22
     */
    public function setDescription( $value = null, $params = null, $index = null ) {
        if( empty( $value )) {
            $this->assertEmptyValue( $value, self::DESCRIPTION );
            $value  = Util::$SP0;
            $params = [];
        }
        if( self::VJOURNAL != $this->getCompType()) {
            $index = 1;
        }
        $this->setMval( $this->description, $value, $params,null, $index );
        return $this;
    }
}
