import React, { Component, Fragment } from "react";
import Link from "./Link";
import { gql } from "apollo-boost";
import { useQuery } from "@apollo/react-hooks";
import { LINKS_PER_PAGE } from "../constants";

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
  query FeedQuery($first: Int, $skip: Int, $orderBy: LinkOrderByInput) {
    feed(first: $first, skip: $skip, orderBy: $orderBy) {
      links {
        id
        createdAt
        url
        description
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
      count
    }
  }
`;
const _updateCacheAfterVote = (store, createVote, linkId, props) => {
  const isNewPage = props.location.pathname.includes("new");
  const page = parseInt(props.match.params.page, 10);
  const skip = isNewPage ? (page - 1) * LINKS_PER_PAGE : 0;
  const first = isNewPage ? LINKS_PER_PAGE : 100;
  const orderBy = isNewPage ? "createdAt_DESC" : null;
  const data = store.readQuery({
    query: Feed_Query,
    variables: {
      first,
      skip,
      orderBy,
    },
  });
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
const _getQueryVariables = (props) => {
  const isNewPage = props.location.pathname.includes("new");
  const page = parseInt(props.match.params.page, 10);

  const first = isNewPage ? LINKS_PER_PAGE : 100;
  const skip = isNewPage ? (page - 1) * LINKS_PER_PAGE : 0;
  const orderBy = isNewPage ? "createdAt_DESC" : null;
  return { first, skip, orderBy };
};

const _getLinksToRender = (data, props) => {
  const isNewPage = props.location.pathname.includes("new");
  if (isNewPage) {
    return data.feed.links;
  }
  const rankedLinks = data.feed.links.slice();
  rankedLinks.sort((l1, l2) => l2.votes.length - l1.votes.length);
  return rankedLinks;
};

const _nextPage = (data, props) => {
  const page = parseInt(props.match.params.page, 10);
  if (page <= data.feed.count / LINKS_PER_PAGE) {
    const nextPage = page + 1;
    props.history.push(`/new/${nextPage}`);
  }
};

const _previousPage = (props) => {
  const page = parseInt(props.match.params.page, 10);
  if (page > 1) {
    const previousPage = page - 1;
    props.history.push(`/new/${previousPage}`);
  }
};

function LinkList(props) {
  const { first, skip, orderBy } = _getQueryVariables(props);

  console.log(first, skip, orderBy);
  const { data, loading, error, subscribeToMore } = useQuery(Feed_Query, {
    variables: { first, skip, orderBy },
  });
  console.log(first, skip, orderBy, data, loading, error);
  _subscribeToNewLinks(subscribeToMore);
  _subscribeToNewVotes(subscribeToMore);
  // const linksToRender = _getLinksToRender(data, props);
  const isNewPage = props.location.pathname.includes("new");
  const pageIndex = props.match.params.page
    ? (props.match.params.page - 1) * LINKS_PER_PAGE
    : 0;

  return (
    <Fragment>
      <Fragment>
        {loading ? (
          <h1>Loading...</h1>
        ) : error ? (
          <h1>Error</h1>
        ) : (
          _getLinksToRender(data, props).map((link, index) => (
            <Link
              key={link.id}
              link={link}
              index={index + pageIndex}
              updataStoreAfterVote={_updateCacheAfterVote}
            />
          ))
        )}
      </Fragment>
      <Fragment>
        {isNewPage && (
          <div className="flex ml4 mv3 gray">
            <div
              className="pointer mr2"
              onClick={() => {
                _previousPage(props);
              }}
            >
              Previous
            </div>
            <div
              className="pointer"
              onClick={() => {
                _nextPage(data, props);
              }}
            >
              Next
            </div>
          </div>
        )}
      </Fragment>
    </Fragment>
  );
}

export default LinkList;
