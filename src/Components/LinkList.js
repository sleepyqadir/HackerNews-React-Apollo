import React, { Component, Fragment } from "react";
import Link from "./Link";
import { gql } from "apollo-boost";
import { useQuery } from "@apollo/react-hooks";

const NEW_LINKS_SUBSCRIPTION = gql`
  subscription {
    newLink {
      id
      url
      description
      createdAt
      postedBy {
        name
        id
      }
      votes {
        user {
          id
        }
      }
    }
  }
`;

const NEW_VOTES_SUBSCRIPTION = gql`
  subscription {
    newVote {
      id
      link {
        id
        url
        description
        createdAt
        postedBy {
          id
          name
        }
        votes {
          id
          user {
            id
          }
        }
      }
      user {
        id
      }
    }
  }
`;

export const Feed_Query = gql`
  {
    feed {
      links {
        description
        createdAt
        url
        id
        postedBy {
          id
          name
        }
        votes {
          id
          user {
            id
          }
        }
      }
    }
  }
`;
const _updateCacheAfterVote = (store, createVote, linkId) => {
  const data = store.readQuery({ query: Feed_Query });
  const votedLink = data.fee.links.find((link) => link.id === linkId);
  votedLink.votes = createVote.link.votes;
  store.writeQuery({ query: Feed_Query, data });
};

const _subscribeToNewLinks = (subscribeToMore) => {
  subscribeToMore({
    document: NEW_LINKS_SUBSCRIPTION,
    updatequery: (prev, { subscriptionData }) => {
      if (!subscriptionData.data) return prev;
      const newLink = subscriptionData.data.newLink;
      const exists = prev.feed.links.find(({ id }) => id === newLink.id);
      if (exists) return prev;
      return Object.assign({}, prev, {
        feed: {
          links: [newLink, ...prev.feed.links],
          count: prev.feed.links.length + 1,
          __typename: prev.feed.__typename,
        },
      });
    },
  });
};

const _subscribeToNewVotes = (subscribeToMore) => {
  subscribeToMore({
    document: NEW_VOTES_SUBSCRIPTION,
  });
};

function LinkList() {
  const { data, loading, error, subscribeToMore } = useQuery(Feed_Query);
  _subscribeToNewLinks(subscribeToMore);
  _subscribeToNewVotes(subscribeToMore);
  return (
    <Fragment>
      {loading ? (
        <h1>Loading...</h1>
      ) : error ? (
        <h1>Error</h1>
      ) : (
        data.feed.links.map((link, index) => (
          <Link
            key={link.id}
            link={link}
            index={index}
            updataStoreAfterVote={_updateCacheAfterVote}
          />
        ))
      )}
    </Fragment>
  );
}

export default LinkList;
