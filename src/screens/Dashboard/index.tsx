import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { HighlightCard } from '../../components/HighlightCard';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from 'styled-components';

import {
  TransactionCard,
  TransactionCardProps,
} from '../../components/TransactionCard';

import {
  Container,
  Header,
  Photo,
  User,
  UserGreeting,
  UserInfo,
  UserName,
  UserWrapper,
  Icon,
  HighlightCards,
  Transactions,
  Title,
  TransactionsList,
  LogoutButton,
  LoadContainer,
} from './styles';
import { useAuth } from '../../hooks/auth';

export interface DateListProps extends TransactionCardProps {
  id: string;
}

interface highlightProps {
  amount: string;
  lastTransaction: string;
}

interface highlightData {
  entries: highlightProps;
  expensives: highlightProps;
  total: highlightProps;
}

export function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<DateListProps[]>([]);
  const [highlightData, setHighlightData] = useState<highlightData>(
    {} as highlightData
  );

  const theme = useTheme();
  const { signOut, user } = useAuth();

  function getLastTransactionDate(
    collection: DateListProps[],
    type: 'positive' | 'negative'
  ) {
    const collectionFilttered = collection.filter(
      (transaction) => transaction.type === type
    );

    if (collectionFilttered.length === 0) {
      return 0;
    }

    const lastTransaction = new Date(
      Math.max.apply(
        Math,
        collectionFilttered.map((transaction) =>
          new Date(transaction.date).getTime()
        )
      )
    );
    return `${lastTransaction.getDate()} de ${lastTransaction.toLocaleString(
      'pt-BR',
      { month: 'long' }
    )}`;
  }

  async function loadTransactions() {
    const dataKey = `@gofinances:transactions_user:${user.id}`;
    const response = await AsyncStorage.getItem(dataKey);
    const transactions = response ? JSON.parse(response) : [];

    let entriesTotal = 0;
    let expensiveTotal = 0;

    const transactionsFormatted: DateListProps[] = transactions.map(
      (item: DateListProps) => {
        if (item.type === 'positive') {
          entriesTotal += Number(item.amount);
        } else {
          expensiveTotal -= Number(item.amount);
        }

        const amount = Number(item.amount).toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        });

        const date = Intl.DateTimeFormat('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: '2-digit',
        }).format(new Date(item.date));

        return {
          id: item.id,
          name: item.name,
          amount,
          type: item.type,
          category: item.category,
          date,
        };
      }
    );

    setTransactions(transactionsFormatted);

    const lastTransactionEntries = getLastTransactionDate(
      transactions,
      'positive'
    );
    const lastTransactionExpensives = getLastTransactionDate(
      transactions,
      'negative'
    );

    const totalInterval =
      lastTransactionExpensives === 0
        ? 'Não há transações'
        : `01 a ${lastTransactionExpensives}`;

    const total = entriesTotal + expensiveTotal;

    setHighlightData({
      entries: {
        amount: entriesTotal.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }),
        lastTransaction:
          lastTransactionEntries === 0
            ? 'Não há transações'
            : `Última entrada dia ${lastTransactionEntries}`,
      },
      expensives: {
        amount: expensiveTotal.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }),
        lastTransaction:
          lastTransactionExpensives === 0
            ? 'Não há transações'
            : `Última entrada dia ${lastTransactionExpensives}`,
      },
      total: {
        amount: total.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }),
        lastTransaction: totalInterval,
      },
    });

    setIsLoading(false);
  }

  useEffect(() => {
    loadTransactions();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, [])
  );

  return (
    <Container>
      {isLoading ? (
        <LoadContainer>
          <ActivityIndicator color={theme.colors.primary} size="large" />
        </LoadContainer>
      ) : (
        <>
          <Header>
            <UserWrapper>
              <UserInfo>
                <Photo
                  source={{
                    uri: user.photo,
                  }}
                />
                <User>
                  <UserGreeting>Olá, </UserGreeting>
                  <UserName>{user.name}</UserName>
                </User>
              </UserInfo>

              <LogoutButton onPress={signOut}>
                <Icon name="power" />
              </LogoutButton>
            </UserWrapper>
          </Header>

          <HighlightCards>
            <HighlightCard
              title="Entradas"
              amount={highlightData.entries.amount}
              lastTransaction={highlightData.entries.lastTransaction}
              type="up"
            />
            <HighlightCard
              title="Saídas"
              amount={highlightData.expensives.amount}
              lastTransaction={highlightData.expensives.lastTransaction}
              type="down"
            />
            <HighlightCard
              title="Total"
              amount={highlightData.total.amount}
              lastTransaction={highlightData.total.lastTransaction}
              type="total"
            />
          </HighlightCards>

          <Transactions>
            <Title>Listagem</Title>

            <TransactionsList
              data={transactions}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <TransactionCard data={item} />}
            />
          </Transactions>
        </>
      )}
    </Container>
  );
}
