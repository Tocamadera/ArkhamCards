import React, { ReactNode } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { bindActionCreators, Dispatch, Action } from 'redux';
import { connect } from 'react-redux';
// @ts-ignore
import MaterialCommunityIcons from 'react-native-vector-icons/dist/MaterialCommunityIcons';

import { showDeckModal } from '../navHelper';
import DeckListRow from '../DeckListRow';
import { Deck } from '../../actions/types';
import AppIcon from '../../assets/AppIcon';
import Card, { CardsMap } from '../../data/Card';
import { fetchPrivateDeck } from '../../actions';
import { getDeck, AppState } from '../../reducers';

type RenderDeckDetails = (
  deck: Deck,
  investigator: Card,
  previousDeck?: Deck
) => ReactNode;

interface OwnProps {
  componentId: string;
  id: number;
  deckRemoved?: (id: number, deck?: Deck, investigator?: Card) => void;
  investigators: CardsMap;
  cards: CardsMap;
  renderSubDetails?: RenderDeckDetails;
  renderDetails?: RenderDeckDetails;
  compact?: boolean;
  viewDeckButton?: boolean;
}

interface ReduxProps {
  theDeck?: Deck;
  thePreviousDeck?: Deck;
}

interface ReduxActionProps {
  fetchPrivateDeck: (deckId: number) => void;
}

type Props =
  OwnProps &
  ReduxProps &
  ReduxActionProps;

class DeckRow extends React.Component<Props> {
  _onDeckPress = () => {
    const {
      componentId,
      theDeck,
      investigators,
    } = this.props;
    if (theDeck) {
      showDeckModal(componentId, theDeck, investigators[theDeck.investigator_code]);
    }
  };

  _onRemove = () => {
    const {
      deckRemoved,
      id,
      theDeck,
      investigators,
    } = this.props;
    deckRemoved && deckRemoved(id, theDeck, theDeck ? investigators[theDeck.investigator_code] : undefined);
  };

  componentDidMount() {
    const {
      id,
      theDeck,
      fetchPrivateDeck,
    } = this.props;
    if (!theDeck) {
      fetchPrivateDeck(id);
    }
  }

  renderSubDetails() {
    const {
      theDeck,
      thePreviousDeck,
      investigators,
      renderSubDetails,
    } = this.props;
    if (theDeck && renderSubDetails) {
      return renderSubDetails(
        theDeck,
        investigators[theDeck.investigator_code],
        thePreviousDeck
      );
    }
    return null;
  }

  renderDetails() {
    const {
      theDeck,
      thePreviousDeck,
      investigators,
      renderDetails,
    } = this.props;
    if (!theDeck || !renderDetails) {
      return null;
    }
    return renderDetails(
      theDeck,
      investigators[theDeck.investigator_code],
      thePreviousDeck
    );
  }

  render() {
    const {
      theDeck,
      thePreviousDeck,
      cards,
      deckRemoved,
      compact,
      viewDeckButton,
    } = this.props;
    if (!theDeck) {
      return null;
    }
    const titleButton: ReactNode = deckRemoved ? (
      <View style={styles.row}>
        <TouchableOpacity onPress={this._onRemove}>
          <MaterialCommunityIcons name="close" size={32} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    ) : (
      <TouchableOpacity onPress={this._onDeckPress}>
        <AppIcon name="deck" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    );
    return (
      <DeckListRow
        deck={theDeck}
        previousDeck={thePreviousDeck}
        cards={cards}
        onPress={this._onDeckPress}
        investigator={cards[theDeck.investigator_code]}
        titleButton={titleButton}
        details={this.renderDetails()}
        subDetails={this.renderSubDetails()}
        compact={compact}
        viewDeckButton={viewDeckButton}
      />
    );
  }
}

function mapStateToProps(state: AppState, props: OwnProps): ReduxProps {
  const deck = getDeck(state, props.id);
  const previousDeck = deck && deck.previous_deck && getDeck(state, deck.previous_deck);
  return {
    theDeck: deck || undefined,
    thePreviousDeck: previousDeck || undefined,
  };
}

function mapDispatchToProps(
  dispatch: Dispatch<Action>
): ReduxActionProps {
  return bindActionCreators({ fetchPrivateDeck }, dispatch);
}

export default connect<ReduxProps, ReduxActionProps, OwnProps, AppState>(
  mapStateToProps,
  mapDispatchToProps
)(DeckRow);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
