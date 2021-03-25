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
 * COMMENT property functions
 *
 * @author Kjell-Inge Gustafsson, kigkonsult <ical@kigkonsult.se>
 * @since 2.27.3 2018-12-22
 */
trait COMMENTtrait
{
    /**
     * @var array component property COMMENT value
     * @access protected
     */
    protected $comment = null;

    /**
     * Return formatted output for calendar component property comment
     *
     * @return string
     */
    public function createComment() {
        if( empty( $this->comment )) {
            return null;
        }
        $output = null;
        $lang   = $this->getConfig( self::LANGUAGE );
        foreach( $this->comment as $cx => $commentPart ) {
            if( empty( $commentPart[Util::$LCvalue] )) {
                if( $this->getConfig( self::ALLOWEMPTY )) {
                    $output .= StringFactory::createElement( self::COMMENT );
                }
                continue;
            }
            $output .= StringFactory::createElement(
                self::COMMENT,
                ParameterFactory::createParams( $commentPart[Util::$LCparams], self::$ALTRPLANGARR, $lang ),
                StringFactory::strrep( $commentPart[Util::$LCvalue] )
            );
        }
        return $output;
    }

    /**
     * Delete calendar component property comment
     *
     * @param int   $propDelIx   specific property in case of multiply occurrence
     * @return bool
     * @since  2.27.1 - 2018-12-15
     */
    public function deleteComment( $propDelIx = null ) {
        if( empty( $this->comment )) {
            unset( $this->propDelIx[self::COMMENT] );
            return false;
        }
        return $this->deletePropertyM( $this->comment, self::COMMENT, $propDelIx );
    }

    /**
     * Get calendar component property comment
     *
     * @param int    $propIx specific property in case of multiply occurrence
     * @param bool   $inclParam
     * @return bool|array
     * @since  2.27.1 - 2018-12-12
     */
    public function getComment( $propIx = null, $inclParam = false ) {
        if( empty( $this->comment )) {
            unset( $this->propIx[self::COMMENT] );
            return false;
        }
        return $this->getPropertyM( $this->comment, self::COMMENT, $propIx, $inclParam );
    }

    /**
     * Set calendar component property comment
     *
     * @param string  $value
     * @param array   $params
     * @param integer $index
     * @return static
     * @throws InvalidArgumentException
     * @since 2.27.3 2018-12-22
     */
    public function setComment( $value = null, $params = null, $index = null ) {
        if( empty( $value )) {
            $this->assertEmptyValue( $value, self::COMMENT );
            $value  = Util::$SP0;
            $params = [];
        }
        $this->setMval( $this->comment, $value, $params, null, $index );
        return $this;
    }
}
