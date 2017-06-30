/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
*                                                                              *
* This program is free software: you can redistribute it and/or modify         *
* it under the terms of the GNU Affero General Public License as published by  *
* the Free Software Foundation, either version 3 of the License, or            *
* (at your option) any later version.                                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* GNU Affero General Public License for more details.                          *
*                                                                              *
* You should have received a copy of the GNU Affero General Public License     *
* along with this program.  If not, see <http://www.gnu.org/licenses/>.        *
*                                                                              *
*****************************************************************************©*/
/** @file
 *
 *  Properties are items of information in the brain
 *
 *  ...and containers of other properties. Most internal indicators in Friend Mind
 *  are derived from the Property class, included in this file...
 *
 *  @author FL (François Lionet)
 *  @date first pushed on 12/12/2016
 *  @warning: work in progress... toward intelligence!
 */

/**
 * Reward class
 *
 * @param brain root
 * @param parent object who created this class
 * @param name string with the name of the class
 * @param weight number containing the global weight of the class
 * @param extras string with optional properties to create
 */
function Rewards(brain, parent, name, weight, extras, propertyReader)
{
    this.brain = brain;
    this.parent = parent;

	mergeObjects(this, PropertyLive);
	mergeObjects(this, Rewards);
    PropertyLive.call(this, brain, this, name, weight, extras, function (brain)
    {
        debugger;                   // It works!
    }, propertyReader);
    this.className = "Rewards";
}

/**
 * Thanks class
 *
 * @param brain root
 * @param parent object who created this class
 * @param name string with the name of the class
 * @param weight number containing the global weight of the class
 * @param extras string with optional properties to create
 */
function Thanks(brain, parent, name, weight, extras, propertyReader)
{
    this.brain = brain;
    this.parent = parent;

    mergeObjects(this, PropertyLive);
    mergeObjects(this, Thanks);
    PropertyLive.call(this, brain, this, name, weight, extras, function (brain)
    {
        debugger;                   // It works!
    }, propertyReader);
    this.className = "Thanks";
}

/**
 * Thanks class
 *
 * @param brain root
 * @param parent object who created this class
 * @param name string with the name of the class
 * @param weight number containing the global weight of the class
 * @param extras string with optional properties to create
 */
function Bravos(brain, parent, name, weight, extras, propertyReader)
{
    this.brain = brain;
    this.parent = parent;

    mergeObjects(this, PropertyLive);
    mergeObjects(this, Thanks);
    PropertyLive.call(this, brain, this, name, weight, extras, function (brain)
    {
        debugger;                   // It works!
    }, propertyReader);
    this.className = "Bravos";
}

/**
 * GoodWorks class
 *
 * @param brain root
 * @param parent object who created this class
 * @param name string with the name of the class
 * @param weight number containing the global weight of the class
 * @param extras string with optional properties to create
 */
function GoodWorks(brain, parent, name, weight, extras, propertyReader)
{
    this.brain = brain;
    this.parent = parent;

    mergeObjects(this, PropertyLive);
    mergeObjects(this, GoodWorks);
    PropertyLive.call(this, brain, this, name, weight, extras, function (brain)
    {
        debugger;                   // It works!
    }, propertyReader);
    this.className = "GoodWorks";
 }

/**
 * BadWorks class
 *
 * @param brain root
 * @param parent object who created this class
 * @param name string with the name of the class
 * @param weight number containing the global weight of the class
 * @param extras string with optional properties to create
 */
function BadWorks(brain, parent, name, weight, extras, propertyReader)
{
    this.brain = brain;
    this.parent = parent;

    mergeObjects(this, PropertyLive);
    mergeObjects(this, BadWorks);
    PropertyLive.call(this, brain, this, name, weight, extras, function (brain)
    {
        debugger;                   // It works!
    }, propertyReader);
    this.className = "BadWorks";
 }

/**
 * Pleases class
 *
 * @param brain root
 * @param parent object who created this class
 * @param name string with the name of the class
 * @param weight number containing the global weight of the class
 * @param extras string with optional properties to create
 */
function Pleases(brain, parent, name, weight, extras, propertyReader)
{
    this.brain = brain;
    this.parent = parent;

    mergeObjects(this, PropertyLive);
    mergeObjects(this, Pleases);
    PropertyLive.call(this, brain, this, name, weight, extras, function (brain)
    {
        debugger;                   // It works!
    }, propertyReader);
    this.className = "Please";
}
