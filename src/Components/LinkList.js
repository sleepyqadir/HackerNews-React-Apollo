import React, { Component, Fragment } from "react";
import Link from "./Link";
import { gql } from "apollo-boost";
import { useQuery } from "@apollo/react-hooks";
const Feed_Query = gql`
  {
    feed {
      links {
        description
        createdAt
        url
        id
      }
    }
  }
`;

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
        data.feed.links.map((link) => <Link key={link.id} link={link} />)
      )}
    </Fragment>
  );
}

export default LinkList;
