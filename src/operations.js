'use strict';

const { removeStateLabels } = require('./labels');

// By the document, we need remove & add assignees to replace them.
//  * https://developer.github.com/v3/issues/assignees/#remove-assignees-from-an-issue
//  * https://developer.github.com/v3/issues/assignees/#add-assignees-to-an-issue
async function replaceAssignees(
    aOctoKit,
    owner,
    repo,
    issueNum,
    currentAssignees,
    nextAssignees
) {
    // If this length === 0, this API request would be fail with 400.
    if (currentAssignees.length > 0) {
        await aOctoKit.issues.removeAssignees({
            owner,
            repo,
            // eslint-disable-next-line camelcase
            issue_number: issueNum,
            assignees: currentAssignees
        });
        // TODO: assert return value
    }

    const changeAssign = await aOctoKit.issues.addAssignees({
        owner,
        repo,
        // eslint-disable-next-line camelcase
        issue_number: issueNum,
        assignees: nextAssignees
    });

    return changeAssign;
}

async function assignReviewer(
    aOctoKit,
    repoName,
    issueNum,
    currentAssignees,
    nextAssignees
) {
    const [owner, repo] = repoName.split('/');

    const response = await aOctoKit.issues.listLabelsOnIssue({
        owner,
        repo,
        // eslint-disable-next-line camelcase
        issue_number: issueNum,
    });

    const labels = response.data;

    const bleached = removeStateLabels(labels);
    bleached.push('S-awaiting-review');

    const changeLabels = aOctoKit.issues.replaceLabels({
        owner,
        repo,
        // eslint-disable-next-line camelcase
        issue_number: issueNum,
        labels: bleached
    });

    const changeAssign = replaceAssignees(
        aOctoKit,
        owner,
        repo,
        issueNum,
        currentAssignees,
        nextAssignees
    );

    await Promise.all([changeLabels, changeAssign]);
}

async function acceptPullRequest(
    aOctoKit,
    repoName,
    issueNum,
    currentAssignees,
    nextAssignees
) {
    const [owner, repo] = repoName.split('/');

    const response = await aOctoKit.issues.listLabelsOnIssue({
        owner,
        repo,
        // eslint-disable-next-line camelcase
        issue_number: issueNum
    });

    const labels = response.data;

    const bleached = removeStateLabels(labels);
    bleached.push('S-awaiting-merge');

    const changeLabels = aOctoKit.issues.replaceLabels({
        owner,
        repo,
        // eslint-disable-next-line camelcase
        issue_number: issueNum,
        labels: bleached
    });

    const changeAssign = replaceAssignees(
        aOctoKit,
        owner,
        repo,
        issueNum,
        currentAssignees,
        nextAssignees
    );
    await Promise.all([changeLabels, changeAssign]);
}

async function rejectPullRequest(
    aOctoKit,
    repoName,
    issueNum,
    currentAssignees,
    nextAssignees
) {
    const [owner, repo] = repoName.split('/');

    const response = await aOctoKit.issues.listLabelsOnIssue({
        owner,
        repo,
        // eslint-disable-next-line camelcase
        issue_number: issueNum,
    });

    const labels = response.data;

    const bleached = removeStateLabels(labels);
    bleached.push('S-needs-code-change');

    const changeLabels = aOctoKit.issues.replaceLabels({
        owner,
        repo,
        // eslint-disable-next-line camelcase
        issue_number: issueNum,
        labels: bleached
    });

    const changeAssign = replaceAssignees(
        aOctoKit,
        owner,
        repo,
        issueNum,
        currentAssignees,
        nextAssignees
    );

    await Promise.all([changeLabels, changeAssign]);
}

module.exports = Object.freeze({
    assignReviewer,
    acceptPullRequest,
    rejectPullRequest
});
