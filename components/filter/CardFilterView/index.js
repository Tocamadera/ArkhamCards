import React from 'react';
import PropTypes from 'prop-types';
import { keys, forEach, filter, indexOf, map, partition } from 'lodash';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { connect } from 'react-redux';

import L from '../../../app/i18n';
import FactionChooser from './FactionChooser';
import XpChooser from './XpChooser';
import SkillIconChooser from './SkillIconChooser';
import FilterChooserButton from '../FilterChooserButton';
import SliderChooser from '../SliderChooser';
import ToggleFilter from '../../core/ToggleFilter';
import withFilterFunctions from '../withFilterFunctions';
import NavButton from '../../core/NavButton';
import { FACTION_CODES } from '../../../constants';
import { getAllPacks } from '../../../reducers';
import { COLORS } from '../../../styles/colors';

const CARD_FACTION_CODES = [...FACTION_CODES, 'mythos'];

class CardFilterView extends React.Component {
  static propTypes = {
    componentId: PropTypes.string.isRequired,
    cards: PropTypes.object,
    filters: PropTypes.object,
    defaultFilterState: PropTypes.object,
    width: PropTypes.number,
    pushFilterView: PropTypes.func.isRequired,
    onToggleChange: PropTypes.func.isRequired,
    onFilterChange: PropTypes.func.isRequired,
    allPacks: PropTypes.array,
  };

  static get options() {
    return {
      topBar: {
        title: {
          text: L('Filter'),
          color: COLORS.navButton,
        },
      },
    };
  }

  constructor(props) {
    super(props);

    this.state = {
      loading: true,
      hasCost: false,
      hasXp: false,
      hasSkill: false,
      allUses: [],
      allFactions: CARD_FACTION_CODES,
      allTraits: [],
      allTypes: [],
      allTypeCodes: [],
      allSubTypes: [],
      allPacks: [],
      allSlots: [],
      allEncounters: [],
      allIllustrators: [],
      levels: [],
    };

    this._onPacksPress = this.onPacksPress.bind(this);
    this._onEnemyPress = this.onEnemyPress.bind(this);
    this._onLocationPress = this.onLocationPress.bind(this);
  }

  componentDidMount() {
    const {
      cards,
    } = this.props;
    setTimeout(() => {
      const allFactions = filter(FACTION_CODES, faction_code =>
        cards.filtered(`faction_code == '${faction_code}'`).length > 0);
      let hasCost = false;
      let hasXp = false;
      let hasSkill = false;
      const typesMap = {};
      const typeCodesMap = {};
      const usesMap = {};
      const subTypesMap = {};
      const traitsMap = {};
      const packsMap = {};
      const slotsMap = {};
      const encountersMap = {};
      const illustratorsMap = {};
      forEach(cards, card => {
        if (card.cost !== null) {
          hasCost = true;
        }
        if (card.xp !== null) {
          hasXp = true;
        }
        if (!hasSkill && (
          card.skill_willpower ||
          card.skill_intellect ||
          card.skill_combat ||
          card.skill_agility ||
          card.skill_wild
        )) {
          hasSkill = true;
        }
        if (card.traits) {
          forEach(
            filter(map(card.traits.split('.'), t => t.trim()), t => t),
            t => {
              traitsMap[t] = 1;
            });
        }
        if (card.subtype_name) {
          subTypesMap[card.subtype_name] = 1;
        }
        if (card.uses) {
          usesMap[card.uses] = 1;
        }
        if (card.pack_name) {
          packsMap[card.pack_name] = 1;
        }
        if (card.slot) {
          if (card.slot.indexOf('.') !== -1) {
            forEach(
              map(card.slot.split('.'), s => s.trim()),
              s => {
                slotsMap[s] = 1;
              }
            );
          } else {
            slotsMap[card.slot] = 1;
          }
        }
        if (card.encounter_name) {
          encountersMap[card.encounter_name] = 1;
        }
        if (card.illustrator) {
          illustratorsMap[card.illustrator] = 1;
        }
        typesMap[card.type_name] = 1;
        typeCodesMap[card.type_code] = 1;
      });

      this.setState({
        loading: false,
        allFactions,
        hasCost,
        hasXp,
        hasSkill,
        allUses: keys(usesMap).sort(),
        allTraits: keys(traitsMap).sort(),
        allTypes: keys(typesMap).sort(),
        allTypeCodes: keys(typeCodesMap).sort(),
        allSubTypes: keys(subTypesMap).sort(),
        allPacks: keys(packsMap).sort(),
        allSlots: keys(slotsMap).sort(),
        allEncounters: keys(encountersMap).sort(),
        allIllustrators: keys(illustratorsMap).sort(),
      });
    }, 0);
  }

  onPacksPress() {
    this.props.pushFilterView('SearchFilters.Packs');
  }

  onEnemyPress() {
    this.props.pushFilterView('SearchFilters.Enemy');
  }

  onLocationPress() {
    this.props.pushFilterView('SearchFilters.Location');
  }

  onToggleChange(key) {
    this.props.onToggleChange(key);
  }

  onFilterChange(key, selection) {
    this.props.onFilterChange(key, selection);
  }

  static rangeText(name, values) {
    if (values[0] === values[1]) {
      return `${name}(${values[0]})`;
    }
    return `${name}(${values[0]}-${values[1]})`;
  }

  selectedPacksText() {
    const {
      filters: {
        packs,
      },
      allPacks,
    } = this.props;
    if (!allPacks.length || !packs.length) {
      return L('Packs: All');
    }
    const selectedPackNames = new Set(packs);
    const cyclePackCounts = {};
    const selectedCyclePackCounts = {};
    const cycleNames = {};
    const selectedPacks = filter(
      allPacks,
      pack => {
        if (pack.cycle_position > 1 && pack.cycle_position < 50) {
          if (pack.position === 1) {
            cycleNames[pack.cycle_position] = pack.name;
          }
          cyclePackCounts[pack.cycle_position] =
            (cyclePackCounts[pack.cycle_position] || 0) + 1;
        }
        if (selectedPackNames.has(pack.name)) {
          selectedCyclePackCounts[pack.cycle_position] =
            (selectedCyclePackCounts[pack.cycle_position] || 0) + 1;
          return true;
        }
        return false;
      }
    );
    const [completeCycles, partialCycles] = partition(
      keys(selectedCyclePackCounts),
      cycle_position => selectedCyclePackCounts[cycle_position] === cyclePackCounts[cycle_position]);

    const parts = [];
    forEach(completeCycles, cycle_position => {
      parts.push(
        L('{{cycleName}} Cycle', { cycleName: cycleNames[cycle_position] })
      );
    });
    const partialCyclesSet = new Set(partialCycles);
    forEach(selectedPacks, pack => {
      if (partialCyclesSet.has(`${pack.cycle_position}`)) {
        parts.push(pack.name);
      }
    });
    return L('Packs: {{allPacks}}', { allPacks: parts.join(', ') });
  }

  enemyFilterText() {
    const {
      filters: {
        enemyElite,
        enemyNonElite,
        enemyHunter,
        enemyNonHunter,
        enemyParley,
        enemyRetaliate,
        enemyAlert,
        enemySpawn,
        enemyPrey,
        enemyAloof,
        enemyMassive,
        enemyHealthEnabled,
        enemyHealth,
        enemyHealthPerInvestigator,
        enemyDamageEnabled,
        enemyDamage,
        enemyHorrorEnabled,
        enemyHorror,
        enemyFightEnabled,
        enemyFight,
        enemyEvadeEnabled,
        enemyEvade,
      },
    } = this.props;
    const parts = [];
    if (enemyElite) {
      parts.push(L('Elite'));
    }
    if (enemyNonElite) {
      parts.push(L('Non-Elite'));
    }
    if (enemyHunter) {
      parts.push(L('Hunter'));
    }
    if (enemyNonHunter) {
      parts.push(L('Non-Hunter'));
    }
    if (enemyParley) {
      parts.push(L('Parley'));
    }
    if (enemyRetaliate) {
      parts.push(L('Retaliate'));
    }
    if (enemyAlert) {
      parts.push(L('Alert'));
    }
    if (enemySpawn) {
      parts.push(L('Spawn'));
    }
    if (enemyPrey) {
      parts.push(L('Prey'));
    }
    if (enemyAloof) {
      parts.push(L('Aloof'));
    }
    if (enemyMassive) {
      parts.push(L('Massive'));
    }
    if (enemyHealthEnabled) {
      if (enemyHealthPerInvestigator) {
        parts.push(CardFilterView.rangeText(L('HPI'), enemyHealth));
      } else {
        parts.push(CardFilterView.rangeText(L('Health'), enemyHealth));
      }
    }
    if (enemyDamageEnabled) {
      parts.push(CardFilterView.rangeText(L('Damage'), enemyDamage));
    }
    if (enemyHorrorEnabled) {
      parts.push(CardFilterView.rangeText(L('Horror'), enemyHorror));
    }
    if (enemyFightEnabled) {
      parts.push(CardFilterView.rangeText(L('Fight'), enemyFight));
    }
    if (enemyEvadeEnabled) {
      parts.push(CardFilterView.rangeText(L('Evade'), enemyEvade));
    }

    if (parts.length === 0) {
      return L('Enemies: All');
    }
    return L('Enemies: {{parts}}', { parts: parts.join(', ') });
  }

  locationFilterText() {
    const {
      filters: {
        shroud,
        shroudEnabled,
        clues,
        cluesEnabled,
        cluesFixed,
        hauntedEnabled,
      },
    } = this.props;
    const parts = [];
    if (cluesEnabled) {
      if (cluesFixed) {
        parts.push(CardFilterView.rangeText(L('Fixed Clues'), clues));
      } else {
        parts.push(CardFilterView.rangeText(L('Clues'), clues));
      }
    }
    if (shroudEnabled) {
      parts.push(CardFilterView.rangeText(L('Shroud'), shroud));
    }
    if (hauntedEnabled) {
      parts.push(L('Haunted'));
    }

    if (parts.length === 0) {
      return L('Locations: All');
    }
    return L('Locations: {{parts}}', { parts: parts.join(', ') });
  }

  render() {
    const {
      componentId,
      width,
      defaultFilterState,
      filters: {
        uses,
        factions,
        traits,
        types,
        subTypes,
        packs,
        slots,
        encounters,
        illustrators,
        victory,
        vengeance,
        skillIcons,
        skillEnabled,
        level,
        levelEnabled,
        exceptional,
        nonExceptional,
        cost,
        costEnabled,
        unique,
        permanent,
        fast,
        exile,
      },
      onToggleChange,
      onFilterChange,
    } = this.props;
    const {
      loading,
      allUses,
      allFactions,
      allTraits,
      allTypes,
      allTypeCodes,
      allSubTypes,
      allPacks,
      allSlots,
      allEncounters,
      allIllustrators,
      hasCost,
      hasXp,
      hasSkill,
    } = this.state;

    if (loading) {
      return (
        <View style={styles.loadingWrapper}>
          <ActivityIndicator
            style={[{ height: 80 }]}
            size="small"
            animating
          />
        </View>
      );
    }

    return (
      <ScrollView>
        <FactionChooser
          factions={allFactions}
          selection={factions}
          onFilterChange={onFilterChange}
        />
        { hasXp && (
          <XpChooser
            maxLevel={defaultFilterState.level[1]}
            levels={level}
            enabled={levelEnabled}
            onFilterChange={onFilterChange}
            onToggleChange={onToggleChange}
            exceptional={exceptional}
            nonExceptional={nonExceptional}
          />
        ) }
        { hasXp && (
          <SliderChooser
            label={L('Level')}
            width={width}
            values={level}
            enabled={levelEnabled}
            setting="level"
            onFilterChange={onFilterChange}
            toggleName="levelEnabled"
            onToggleChange={onToggleChange}
            max={defaultFilterState.level[1]}
            height={2}
          >
            <View>
              <ToggleFilter
                label={L('Exceptional')}
                setting="exceptional"
                value={exceptional}
                onChange={onToggleChange}
              />
              <ToggleFilter
                label={L('Non-Exceptional')}
                setting="nonExceptional"
                value={nonExceptional}
                onChange={onToggleChange}
              />
            </View>
          </SliderChooser>
        ) }
        <View>
          { (types.length > 0 || allTypes.length > 0) && (
            <FilterChooserButton
              componentId={componentId}
              title={L('Types')}
              values={allTypes}
              selection={types}
              setting="types"
              onFilterChange={onFilterChange}
            />
          ) }
          { (subTypes.length > 0 || allSubTypes.length > 0) && (
            <FilterChooserButton
              componentId={componentId}
              title={L('SubTypes')}
              values={allSubTypes}
              selection={subTypes}
              setting="subTypes"
              onFilterChange={onFilterChange}
            />
          ) }
        </View>
        { hasCost && (
          <SliderChooser
            label={L('Cost')}
            width={width}
            values={cost}
            enabled={costEnabled}
            setting="cost"
            onFilterChange={onFilterChange}
            toggleName="costEnabled"
            onToggleChange={onToggleChange}
            max={defaultFilterState.cost[1]}
          />
        ) }
        { hasSkill && (
          <SkillIconChooser
            skillIcons={skillIcons}
            setting="skillIcons"
            onFilterChange={onFilterChange}
            enabled={skillEnabled}
            onToggleChange={onToggleChange}
          />
        ) }
        <View>
          { (traits.length > 0 || allTraits.length > 0) && (
            <FilterChooserButton
              title={L('Traits')}
              componentId={componentId}
              values={allTraits}
              selection={traits}
              setting="traits"
              onFilterChange={onFilterChange}
            />
          ) }
          { indexOf(allTypeCodes, 'enemy') !== -1 && (
            <NavButton text={this.enemyFilterText()} onPress={this._onEnemyPress} />
          ) }
          { indexOf(allTypeCodes, 'location') !== -1 && (
            <NavButton text={this.locationFilterText()} onPress={this._onLocationPress} />
          ) }
        </View>
        { (slots.length > 0 || allSlots.length > 0) && (
          <FilterChooserButton
            componentId={componentId}
            title={L('Slots')}
            values={allSlots}
            selection={slots}
            setting="slots"
            onFilterChange={onFilterChange}
          />
        ) }
        { (uses.length > 0 || allUses.length > 0) && (
          <FilterChooserButton
            componentId={componentId}
            title={L('Uses')}
            values={allUses}
            selection={uses}
            setting="uses"
            onFilterChange={onFilterChange}
          />
        ) }
        <View style={styles.toggleStack}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleColumn}>
              <ToggleFilter
                label={L('Fast')}
                setting="fast"
                value={fast}
                onChange={onToggleChange}
              />
              <ToggleFilter
                label={L('Permanent')}
                setting="permanent"
                value={permanent}
                onChange={onToggleChange}
              />
              <ToggleFilter
                label={L('Victory')}
                setting="victory"
                value={victory}
                onChange={onToggleChange}
              />
            </View>
            <View style={styles.toggleColumn}>
              <ToggleFilter
                label={L('Exile')}
                setting="exile"
                value={exile}
                onChange={onToggleChange}
              />
              <ToggleFilter
                label={L('Unique')}
                setting="unique"
                value={unique}
                onChange={onToggleChange}
              />
              <ToggleFilter
                label={L('Vengeance')}
                setting="vengeance"
                value={vengeance}
                onChange={onToggleChange}
              />
            </View>
          </View>
        </View>
        { (encounters.length > 0 || allEncounters.length > 0) && (
          <FilterChooserButton
            componentId={componentId}
            title={L('Encounter Sets')}
            values={allEncounters}
            selection={encounters}
            setting="encounters"
            onFilterChange={onFilterChange}
          />
        ) }
        { (packs.length > 0 || allPacks.length > 1) && (
          <NavButton text={this.selectedPacksText()} onPress={this._onPacksPress} />
        ) }
        { (illustrators.length > 0 || allIllustrators.length > 0) && (
          <FilterChooserButton
            componentId={componentId}
            title={L('Illustrators')}
            values={allIllustrators}
            selection={illustrators}
            setting="illustrators"
            onFilterChange={onFilterChange}
          />
        ) }
      </ScrollView>
    );
  }
}


function mapStateToProps(state) {
  return {
    allPacks: getAllPacks(state),
  };
}

export default connect(mapStateToProps, {})(withFilterFunctions(CardFilterView));

const styles = StyleSheet.create({
  loadingWrapper: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleStack: {
    borderBottomWidth: 1,
    borderColor: '#bdbdbd',
    paddingBottom: 8,
  },
  toggleRow: {
    marginTop: 4,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  toggleColumn: {
    width: '50%',
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
});
