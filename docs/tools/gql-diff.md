---
aside: false
---

<script lang="ts" setup>
import { buildSchema } from 'graphql';
import { diff as diffSchema } from '@graphql-inspector/core'
import { ref, watch } from 'vue'

const old_schema = ref('')
const new_schema = ref('')
const output = ref<{ message: string; level: "BREAKING" | "NON_BREAKING" | "DANGEROUS"}[]>([])
const error = ref(false)

watch([old_schema, new_schema], async () => {
    error.value = false

    try {
        const aws = `scalar AWSDate
                  scalar AWSTime
                  scalar AWSDateTime
                  scalar AWSTimestamp
                  scalar AWSEmail
                  scalar AWSJSON
                  scalar AWSURL
                  scalar AWSPhone
                  scalar AWSIPAddress
                  scalar BigInt
                  scalar Double

                  directive @aws_subscribe(mutations: [String!]!) on FIELD_DEFINITION

                  directive @deprecated(
                    reason: String
                  ) on FIELD_DEFINITION | INPUT_FIELD_DEFINITION | ENUM | ENUM_VALUE

                  directive @aws_auth(cognito_groups: [String!]!) on FIELD_DEFINITION
                  directive @aws_api_key on FIELD_DEFINITION | OBJECT
                  directive @aws_iam on FIELD_DEFINITION | OBJECT
                  directive @aws_oidc on FIELD_DEFINITION | OBJECT
                  directive @aws_cognito_user_pools(
                    cognito_groups: [String!]
                  ) on FIELD_DEFINITION | OBJECT
                  directive @aws_lambda on FIELD_DEFINITION | OBJECT`

        const logs = await diffSchema(
            buildSchema(aws + '\n' + old_schema.value),
            buildSchema(aws + '\n' + new_schema.value)
        )

        output.value = format(logs)
    } catch(err) {
        output.value = [{ message: err.message, level: 'BREAKING' }]
        error.value = true
    }
})

function format(logs) {
    return logs.map(log => ({ message: log.message, level: log.criticality.level }))
}
</script>

# AppSync GraphQL Schema Diff

Compare changes between AppSync GraphQL Schemas.

<div class="tool">
    <div class="diff">
        <label>
            Old Schema
            <textarea v-model="old_schema" placeholder="Paste old gql schema"></textarea>
        </label>
        <label>
            New Schema
            <textarea v-model="new_schema" placeholder="Paste new gql schema"></textarea>
        </label>
    </div>
    <div class="output" v-if="old_schema && new_schema">
        <label>Output:</label>
        <ol>
            <li v-for="log in output" :class="{ breaking: log.level === 'BREAKING', dangerous: log.level === 'DANGEROUS' }">
                {{ log.level }}: {{ log.message }}
            </li>
        </ol>
        <span v-if="output.length === 0">No differences.</span>
    </div>
</div>

<style lang="scss" scoped>
.tool {
    display: flex;
    flex-direction: column;
    gap: 4rem;
    margin-top: 2rem;
}

.diff {
    display: grid;
    grid-template-columns: 1fr 1fr;
    width: 100%;
    height: 500px;
    gap: 2rem;
    font-size: 0.8rem;

    label {
        font-weight: bold;
    }

    textarea {
        border: 1px solid #1d1d1d;
        display: block;
        width: 100%;
        height: 100%;
        border-radius: 15px;
        padding: 0.5rem;
    }
}

.output {
    display: block;
    font-size: 0.8rem;

    label {
        font-weight: bold;
    }

    span {
        color: green;
    }

    li {
        color: #02a676;

        &.breaking { color: #d6231e; }
        &.dangerous { color: #f8b500; }
    }
}
</style>
