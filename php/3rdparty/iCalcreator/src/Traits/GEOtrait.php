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
use Kigkonsult\Icalcreator\Util\GeoFactory;
use Kigkonsult\Icalcreator\Util\ParameterFactory;

use function floatval;
use function is_array;

/**
 * GEO property functions
 *
 * @author Kjell-Inge Gustafsson, kigkonsult <ical@kigkonsult.se>
 * @since 2.27.3 2018-12-22
 */
trait GEOtrait
{
    /**
     * @var array component property GEO value
     * @access protected
     */
    protected $geo = null;

    /**
     * Return formatted output for calendar component property geo
     *
     * @return string
     */
    public function createGeo() {
        if( empty( $this->geo )) {
            return null;
        }
        if( empty( $this->geo[Util::$LCvalue] )) {
            return ( $this->getConfig( self::ALLOWEMPTY )) ? StringFactory::createElement( self::GEO ) : null;
        }
        return StringFactory::createElement(
            self::GEO,
            ParameterFactory::createParams(
                $this->geo[Util::$LCparams]
            ),
            GeoFactory::geo2str2( $this->geo[Util::$LCvalue][self::LATITUDE], GeoFactory::$geoLatFmt ) .
            Util::$SEMIC .
            GeoFactory::geo2str2( $this->geo[Util::$LCvalue][self::LONGITUDE], GeoFactory::$geoLongFmt )
        );
    }

    /**
     * Delete calendar component property geo
     *
     * @return bool
     * @since  2.27.1 - 2018-12-15
     */
    public function deleteGeo() {
        $this->geo = null;
        return true;
    }

    /**
     * Get calendar component property geo
     *
     * @param bool   $inclParam
     * @return bool|array
     * @since  2.27.1 - 2018-12-12
     */
    public function getGeo( $inclParam = false ) {
        if( empty( $this->geo )) {
            return false;
        }
        return ( $inclParam ) ? $this->geo : $this->geo[Util::$LCvalue];
    }

    /**
     * Get ISO6709 "Standard representation of geographic point location by coordinates"
     *
     * Combining the LOCATION and GEO property values (only if GEO is set)
     * @return bool|string
     * @since 2.27.14 2019-02-27
     */
    public function getGeoLocation() {
        if( false === ( $geo = $this->getGeo())) {
            return false;
        }
        $loc     = $this->getLocation();
        $content = ( empty( $loc )) ? null : $loc . Util::$L;
        return $content .
            GeoFactory::geo2str2( $geo[self::LATITUDE], GeoFactory::$geoLatFmt ) .
            GeoFactory::geo2str2( $geo[self::LONGITUDE], GeoFactory::$geoLongFmt);
    }

    /**
     * Set calendar component property geo
     *
     * @param mixed $latitude
     * @param mixed $longitude
     * @param array $params
     * @return static
     * @since 2.27.3 2018-12-22
     */
    public function setGeo( $latitude = null, $longitude = null, $params = null ) {
        if( isset( $latitude ) && isset( $longitude )) {
            if( ! is_array( $this->geo )) {
                $this->geo = [];
            }
            $this->geo[Util::$LCvalue][self::LATITUDE]  = floatval( $latitude );
            $this->geo[Util::$LCvalue][self::LONGITUDE] = floatval( $longitude );
            $this->geo[Util::$LCparams]                 = ParameterFactory::setParams( $params );
        }
        else {
            $this->assertEmptyValue( $latitude, self::GEO );
            $this->geo = [
                Util::$LCvalue  => Util::$SP0,
                Util::$LCparams => [],
            ];
        }
        return $this;
    }
}
