const questions = [
        {
                id: "q1",
                title: "Question 1: Two Sum",
                description:
                        "Given an integer array nums and an integer target, return indices of the two numbers such that they add up to target. You may assume exactly one valid answer exists, and you may not use the same element twice.",
                constraints: [
                        "2 <= nums.length <= 10^5",
                        "-10^9 <= nums[i] <= 10^9",
                        "-10^9 <= target <= 10^9",
                ],
                samples: [
                        {
                                input: "nums = [2,7,11,15], target = 9",
                                output: "[0,1]",
                        },
                        {
                                input: "nums = [3,2,4], target = 6",
                                output: "[1,2]",
                        },
                ],
                starterCode: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        // TODO: write your solution
        return {};
    }
};`,
                testCases: [
                        {
                                name: "Basic pair",
                                input: "nums = [2,7,11,15], target = 9",
                                expectedOutput: "[0,1]",
                                visible: true,
                        },
                        {
                                name: "Repeated value",
                                input: "nums = [3,3], target = 6",
                                expectedOutput: "[0,1]",
                                visible: true,
                        },
                        {
                                name: "Large hidden case",
                                input: "nums = [1..100000], target = 199999",
                                expectedOutput: "[99998,99999]",
                                visible: false,
                        },
                ],
        },
        {
                id: "q2",
                title: "Question 2: Valid Parentheses",
                description:
                        "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid. A string is valid if open brackets are closed by the same type and in the correct order.",
                constraints: [
                        "1 <= s.length <= 10^4",
                        "s consists only of brackets: ()[]{}",
                ],
                samples: [
                        {
                                input: "s = \"()[]{}\"",
                                output: "true",
                        },
                        {
                                input: "s = \"(]\"",
                                output: "false",
                        },
                ],
                starterCode: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool isValid(string s) {
        // TODO: write your solution
        return false;
    }
};`,
                testCases: [
                        {
                                name: "Nested valid",
                                input: "s = \"({[]})\"",
                                expectedOutput: "true",
                                visible: true,
                        },
                        {
                                name: "Wrong order",
                                input: "s = \"([)]\"",
                                expectedOutput: "false",
                                visible: true,
                        },
                        {
                                name: "Long hidden case",
                                input: "s = 5000 opens followed by 5000 closes",
                                expectedOutput: "true",
                                visible: false,
                        },
                ],
        },
        {
                id: "q3",
                title: "Question 3: Merge Intervals",
                description:
                        "Given an array of intervals where intervals[i] = [starti, endi], merge all overlapping intervals and return an array of non-overlapping intervals that cover all intervals in the input.",
                constraints: [
                        "1 <= intervals.length <= 10^4",
                        "intervals[i].length == 2",
                        "0 <= starti <= endi <= 10^4",
                ],
                samples: [
                        {
                                input: "intervals = [[1,3],[2,6],[8,10],[15,18]]",
                                output: "[[1,6],[8,10],[15,18]]",
                        },
                        {
                                input: "intervals = [[1,4],[4,5]]",
                                output: "[[1,5]]",
                        },
                ],
                starterCode: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<vector<int>> merge(vector<vector<int>>& intervals) {
        // TODO: write your solution
        return {};
    }
};`,
                testCases: [
                        {
                                name: "Simple overlap",
                                input: "intervals = [[1,3],[2,6],[8,10]]",
                                expectedOutput: "[[1,6],[8,10]]",
                                visible: true,
                        },
                        {
                                name: "No overlap",
                                input: "intervals = [[1,2],[3,4],[5,6]]",
                                expectedOutput: "[[1,2],[3,4],[5,6]]",
                                visible: true,
                        },
                        {
                                name: "Hidden dense overlap",
                                input: "intervals = 10000 heavily overlapping ranges",
                                expectedOutput: "[[minStart,maxEnd]]",
                                visible: false,
                        },
                ],
        },
        {
                id: "q4",
                title: "Question 4: Binary Search",
                description:
                        "Given a sorted array of integers nums and a target value, return the index of target if it exists, otherwise return -1. Your algorithm must run in O(log n) time.",
                constraints: [
                        "1 <= nums.length <= 10^5",
                        "-10^4 <= nums[i], target <= 10^4",
                        "All integers in nums are unique and sorted in ascending order",
                ],
                samples: [
                        {
                                input: "nums = [-1,0,3,5,9,12], target = 9",
                                output: "4",
                        },
                        {
                                input: "nums = [-1,0,3,5,9,12], target = 2",
                                output: "-1",
                        },
                ],
                starterCode: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int search(vector<int>& nums, int target) {
        // TODO: write your solution
        return -1;
    }
};`,
                testCases: [
                        {
                                name: "Target present",
                                input: "nums = [1,2,3,4,5], target = 4",
                                expectedOutput: "3",
                                visible: true,
                        },
                        {
                                name: "Target absent",
                                input: "nums = [1,3,5,7], target = 4",
                                expectedOutput: "-1",
                                visible: true,
                        },
                        {
                                name: "Hidden large array",
                                input: "nums = sorted array of size 100000, target = 99999",
                                expectedOutput: "99998",
                                visible: false,
                        },
                ],
        },
];

export default questions;
