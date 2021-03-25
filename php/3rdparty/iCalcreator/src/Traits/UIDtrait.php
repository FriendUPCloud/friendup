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

use function microtime;
/**
 * UID property functions
 *
 * @author Kjell-Inge Gustafsson, kigkonsult <ical@kigkonsult.se>
 * @since  2.27.11 - 2019-01-02
 */
trait UIDtrait
{
    /**
     * @var array component property UID value
     * @access protected
     */
    protected $uid = null;

    /**
     * Return formatted output for calendar component property uid
     *
     * If uid is missing, uid is created
     * @return string
     * @since  2.27.11 - 2019-01-02
     */
    public function createUid() {
        if( self::isUidEmpty( $this->uid )) {
            $this->uid = self::makeUid( $this->getConfig( self::UNIQUE_ID ));
        }
        return StringFactory::createElement(
            self::UID,
            ParameterFactory::createParams( $this->uid[Util::$LCparams] ),
            $this->uid[Util::$LCvalue]
        );
    }

    /**
     * Delete calendar component property uid
     *
     * @return bool
     * @since  2.27.1 - 2018-12-15
     */
    public function deleteUid() {
        $this->uid = null;
        return true;
    }

    /**
     * Get calendar component property uid
     *
     * @param bool   $inclParam
     * @return bool|array
     * @since  2.27.11 - 2019-01-02
     */
    public function getUid( $inclParam = false ) {
        if( self::isUidEmpty( $this->uid )) {
            $this->uid = self::makeUid( $this->getConfig( self::UNIQUE_ID ));
        }
        return ( $inclParam ) ? $this->uid : $this->uid[Util::$LCvalue];
    }

    /**
     * Return bool true if uid is empty
     *
     * @param array  $array
     * @return bool
     * @access private
     * @static
     * @since 2.27.11 2019-01-02
     */
    private static function isUidEmpty( array $array = null ) {
        if( empty( $array )) {
            return true;
        }
        if( empty( $array[Util::$LCvalue] ) &&
            ( Util::$ZERO != $array[Util::$LCvalue] )) {
            return true;
        }
        return false;
    }

    /**
     * Return an unique id for a calendar component object instance
     *
     * @param string $unique_id
     * @return array
     * @access private
     * @static
     * @since  2.22.23 - 2017-02-17
     */
    private static function makeUid( $unique_id ) {
        static $FMT     = '%s-%s@%s';
        static $TMDTHIS = 'Ymd\THisT';
        return [
            Util::$LCvalue  => sprintf(
                $FMT,
                date( $TMDTHIS ),
                substr( microtime(), 2, 4 ) . StringFactory::getRandChars( 6 ),
                $unique_id
            ),
            Util::$LCparams => null,
        ];
    }

    /**
     * Set calendar component property uid
     *
     * If empty input, male one
     * @param string $value
     * @param array  $params
     * @return static
     * @throws InvalidArgumentException
     * @since 2.27.3 2019-01-02
     */
    public function setUid( $value = null, $params = null ) {
        if( empty( $value ) && ( Util::$ZERO != $value )) {
            $this->uid = self::makeUid( $this->getConfig( self::UNIQUE_ID ));
            return $this;
        } // no allowEmpty check here !!!!
        $this->uid = [
            Util::$LCvalue  => StringFactory::trimTrailNL( $value ),
            Util::$LCparams => ParameterFactory::setParams( $params ),
        ];
        return $this;
    }
}
