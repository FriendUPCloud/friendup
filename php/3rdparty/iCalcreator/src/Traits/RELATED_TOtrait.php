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
 * RELATED-TO property functions
 *
 * @author Kjell-Inge Gustafsson, kigkonsult <ical@kigkonsult.se>
 * @since 2.27.3 2018-12-22
 */
trait RELATED_TOtrait
{
    /**
     * @var array component property RELATED_TO value
     * @access protected
     */
    protected $relatedto = null;

    /**
     * Return formatted output for calendar component property related-to
     *
     * @return string
     */
    public function createRelatedTo() {
        if( empty( $this->relatedto )) {
            return null;
        }
        $output = null;
        foreach( $this->relatedto as $rx => $relation ) {
            if( ! empty( $relation[Util::$LCvalue] )) {
                $output .= StringFactory::createElement(
                    self::RELATED_TO,
                    ParameterFactory::createParams( $relation[Util::$LCparams] ),
                    StringFactory::strrep( $relation[Util::$LCvalue] )
                );
            }
            elseif( $this->getConfig( self::ALLOWEMPTY )) {
                $output .= StringFactory::createElement( self::RELATED_TO );
            }
        }
        return $output;
    }

    /**
     * Delete calendar component property related-to
     *
     * @param int   $propDelIx   specific property in case of multiply occurrence
     * @return bool
     * @since  2.27.1 - 2018-12-15
     */
    public function deleteRelatedto( $propDelIx = null ) {
        if( empty( $this->relatedto )) {
            unset( $this->propDelIx[self::RELATED_TO] );
            return false;
        }
        return $this->deletePropertyM( $this->relatedto, self::RELATED_TO, $propDelIx );
    }

    /**
     * Get calendar component property related-to
     *
     * @param int    $propIx specific property in case of multiply occurrence
     * @param bool   $inclParam
     * @return bool|array
     * @since  2.27.1 - 2018-12-12
     */
    public function getRelatedto( $propIx = null, $inclParam = false ) {
        if( empty( $this->relatedto )) {
            unset( $this->propIx[self::RELATED_TO] );
            return false;
        }
        return $this->getPropertyM( $this->relatedto, self::RELATED_TO, $propIx, $inclParam );
    }

    /**
     * Set calendar component property related-to
     *
     * @param string $value
     * @param array  $params
     * @param int    $index
     * @return static
     * @throws InvalidArgumentException
     * @since 2.27.3 2018-12-22
     */
    public function setRelatedTo( $value = null, $params = [], $index = null ) {
        static $RELTYPE = 'RELTYPE';
        static $PARENT  = 'PARENT';
        if( empty( $value )) {
            $this->assertEmptyValue( $value, self::RELATED_TO );
            $value  = Util::$SP0;
            $params = [];

        }
        if( ! empty( $params )) {
            ParameterFactory::existRem( $params, $RELTYPE, $PARENT, true ); // remove default
        }
        $this->setMval( $this->relatedto, StringFactory::trimTrailNL( $value ), $params, null, $index );
        return $this;
    }
}
