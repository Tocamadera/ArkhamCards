import React, { useCallback, useContext, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { t } from 'ttag';
import { logout, login } from '@actions';
import { AppState } from '@reducers';
import DeckCheckboxButton from '@components/deck/controls/DeckCheckboxButton';
import DeckButton from '@components/deck/controls/DeckButton';
import DeckActionRow from '@components/deck/controls/DeckActionRow';

interface Props {
  last?: boolean;
}
export default function ArkhamDbLoginButton({ last }: Props) {
  const dispatch = useDispatch();
  const loading = useSelector((state: AppState) => state.signedIn.loading);
  const signedIn = useSelector((state: AppState) => state.signedIn.status);
  const doLogout = useCallback(() => {
    dispatch(logout());
  }, [dispatch]);
  const loginPressed = useCallback(() => {
    dispatch(login());
  }, [dispatch]);
  const logOutPressed = useCallback(() => {
    Alert.alert(
      t`Are you sure you want to sign out?`,
      t`Data on ArkhamDB will be preserved, but all Campaign data and any edits made without internet might be lost.\n\n If you are having trouble with your account you can also reconnect.`,
      [
        { text: t`Sign Out`, style: 'destructive', onPress: doLogout },
        { text: t`Reconnect Account`, onPress: loginPressed },
        { text: t`Cancel` },
      ],
    );
  }, [doLogout, loginPressed]);
  return (
    <DeckActionRow
      icon="arkhamdb"
      title={signedIn ? t`Logged in` : t`Log in to sync decks`}
      description={t`ArkhamDB`}
      loading={loading}
      control={<DeckButton onPress={signedIn ? logOutPressed : loginPressed} title={signedIn ? t`Log out` : t`Log in`} />}
      last={last}
    />
  );
}
