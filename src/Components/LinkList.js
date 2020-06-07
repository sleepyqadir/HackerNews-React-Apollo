import React, { Component, Fragment } from "react";
import Link from "./Link";
import { gql } from "apollo-boost";
import { useQuery } from "@apollo/react-hooks";
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
function LinkList() {
  const { data, loading, error } = useQuery(Feed_Query);
  console.log(data);
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
