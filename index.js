const express = require("express");
const WikimediaStream = require("wikimedia-streams").default;

const app = express();
const port = 8000;

const stream = new WikimediaStream("revision-create");

let domainsT1Count = {};
let usersT1Count = {};
let domainsT2Count = [{}];
let usersT2Count = [{}];
let domain_ind = 0;
let user_ind = 0;

stream.on("open", () => {
  console.info("Opened connection.");
});
stream.on("error", (event) => {
  console.error("Encountered error", event);
});
const printT1DomainsReport = () => {
  console.log("------------------------------------");
  console.log("Domains count report of last minute ------------------------->");
  const sortedDomains = Object.entries(domainsT1Count).sort(
    (a, b) => b[1] - a[1]
  );
  sortedDomains.forEach(([domain, count]) => {
    console.log(`${domain}: ${count} pages updated`);
  });

  domainsT1Count = {};
};

const printT1UsersReport = () => {
  console.log("------------------------------------");

  console.log("Users count report of last minute ------------------------->");
  const sortedUsers = Object.entries(usersT1Count).sort((a, b) => b[1] - a[1]);
  sortedUsers.forEach(([user, count]) => {
    console.log(`${user}: ${count}`);
  });
  usersT1Count = {};
};

const printT2DomainsReport = () => {
  console.log("------------------------------------");
  console.log(
    "Domains count report of last ",
    domain_ind + 1,
    " minutes ------------------------>"
  );
  let combinedDomains = {};
  domainsT2Count.forEach((domains) => {
    Object.entries(domains).forEach(([domain, count]) => {
      combinedDomains[domain] = combinedDomains[domain]
        ? combinedDomains[domain] + count
        : count;
    });
  });

  const sortedCombinedDomains = Object.entries(combinedDomains).sort(
    (a, b) => b[1] - a[1]
  );

  sortedCombinedDomains.forEach(([domain, count]) => {
    console.log(`${domain}: ${count} pages updated`);
  });

  if (domainsT2Count.length < 5) {
    domainsT2Count.push({});
    domain_ind++;
  } else {
    domainsT2Count.shift();
    domainsT2Count.push({});
  }
};

const printT2UsersReport = () => {
  console.log("------------------------------------");

  console.log(
    "Users count report of last ",
    user_ind + 1,
    " minutes ------------------------>"
  );
  let combinedUsers = {};
  usersT2Count.forEach((users) => {
    Object.entries(users).forEach(([user, count]) => {
      combinedUsers[user] = combinedUsers[user]
        ? Math.max(combinedUsers[user], count)
        : count;
    });
  });

  const sortedCombinedUsers = Object.entries(combinedUsers).sort(
    (a, b) => b[1] - a[1]
  );

  sortedCombinedUsers.forEach(([user, count]) => {
    console.log(`${user}: ${count}`);
  });

  if (usersT2Count.length < 5) {
    usersT2Count.push({});
    user_ind++;
  } else {
    usersT2Count.shift();
    usersT2Count.push({});
  }
};

stream.on("mediawiki.revision-create", (data, event) => {
  domainsT1Count[data.meta.domain] = domainsT1Count[data.meta.domain]
    ? domainsT1Count[data.meta.domain] + 1
    : 1;
  //   if (domainsT2Count.length < 5) {
  domainsT2Count[domain_ind][data.meta.domain] = domainsT2Count[domain_ind][
    data.meta.domain
  ]
    ? domainsT2Count[domain_ind][data.meta.domain] + 1
    : 1;
  //   }
  if (
    data.meta.domain === "en.wikipedia.org" &&
    !data.performer.user_is_bot &&
    data.performer.user_edit_count !== undefined
  ) {
    // console.log(data.performer.user_text, data.performer.user_edit_count);
    usersT1Count[data.performer.user_text] = usersT1Count[
      data.performer.user_text
    ]
      ? Math.max(
          data.performer.user_edit_count,
          usersT1Count[data.performer.user_text]
        )
      : data.performer.user_edit_count;
    // if (usersT2Count.length < 5) {
    usersT2Count[user_ind][data.performer.user_text] = usersT2Count[user_ind][
      data.performer.user_text
    ]
      ? Math.max(
          data.performer.user_edit_count,
          usersT2Count[user_ind][data.performer.user_text]
        )
      : data.performer.user_edit_count;
    // }
  }
});

setInterval(() => {
  printT1DomainsReport();
  printT1UsersReport();

  printT2DomainsReport();
  printT2UsersReport();
}, 10000);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
